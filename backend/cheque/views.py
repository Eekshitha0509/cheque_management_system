import base64
import json
import os
import logging
import re
import io

from datetime import date, datetime
from dateutil import parser

from PIL import Image

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Q
from django.db import transaction

from rest_framework.decorators import api_view

from groq import Groq

from .models import cheque, Alerts
from account.models import Account

logger = logging.getLogger(__name__)
User = get_user_model()

from decouple import config

GRO_KEY = config("GROQ_API_KEY", default=os.environ.get("GROQ_API_KEY"))

if GRO_KEY:
    client = Groq(api_key=GRO_KEY)
else:
    client = None
    print("Warning: GROQ_API_KEY not found. AI features will be disabled.")


def get_actual_balance(user):
    """Fetches real balance from the Account table."""
    try:
        account_record = Account.objects.get(user=user)
        return float(account_record.balance)
    except Account.DoesNotExist:
        return 0.0


def compress_image(image_file):
    """Compresses and encodes an image to base64."""
    img = Image.open(image_file)
    img = img.resize((800, 400))
    img = img.convert("RGB")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=40)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def validate_cheque_input(request) -> dict:
    """Validates input for cheque_reader and returns cleaned data."""
    if request.method != 'POST':
        raise ValueError("POST required")
    username = request.POST.get('username')
    purpose = request.POST.get('purpose', 'General Payment')
    image_file = request.FILES.get('cheque_image')
    if not all([username, image_file]):
        raise ValueError("Missing fields")
    current_user = User.objects.get(username=username)
    return {
        'user': current_user,
        'purpose': purpose,
        'image_file': image_file,
        'image_data': image_file.read()
    }


def prepare_image_for_ai(image_data) -> str:
    """Prepares image data for AI processing."""
    return compress_image(io.BytesIO(image_data))


def extract_cheque_data_via_ai(base64_image) -> dict:
    """Extracts cheque data using AI."""
    if not client:
        raise ValueError("AI client not available")
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Perform OCR on this Indian Cheque and return ONLY a JSON object. "
                        "Rules:\n"
                        "1. 'pay_name': Extract handwritten name after 'Pay' check properly for the letters because they are handwritten.\n"
                        "2. 'amount': Numeric value in the box.\n"
                        "3. 'date': 8 digits from top-right boxes (DDMMYYYY).\n , check for the year properly beacuse they might belong to the current year that is 2026\n"
                        "4. 'micr_line': This refers to the white MICR band at the bottom which is E-13B format. "
                        "The Cheque Number is strictly the FIRST 6 digits found between the '⑆' symbols "
                        "on the extreme left. You MUST include leading zeros also if they are there in the bottom left of the image. "
                        "DO NOT return the 9-digit MICR code that follows it."
                    )
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                }
            ]
        }],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    return json.loads(completion.choices[0].message.content)


def clean_amount(raw_amount: str) -> float:
    """Cleans and parses the amount."""
    return float(re.sub(r"[^\d.]", "", str(raw_amount)) or 0.0)


def clean_micr(raw_micr: str) -> str:
    """Cleans MICR line and extracts cheque number."""
    error_map = {
        'S': '5', 's': '5',
        'B': '8',
        'O': '0', 'o': '0',
        'l': '1', 'I': '1',
        'Z': '2', 'z': '2'
    }
    for wrong_char, right_char in error_map.items():
        raw_micr = raw_micr.replace(wrong_char, right_char)
    micr_match = re.search(r'(\d+)', raw_micr)
    if micr_match:
        return micr_match.group(1)[:6].zfill(6)
    # Fallback if OCR fails
    return f"ERR{datetime.now().strftime('%M%S')}"


def parse_date(raw_date) -> date:
    """Parses the date from extracted data."""
    if not raw_date or str(raw_date).strip() in ["null", "None", ""]:
        return None
    try:
        clean_date_str = re.sub(r"\D", "", str(raw_date))
        return datetime.strptime(clean_date_str[:8], "%d%m%Y").date()
    except Exception:
        try:
            return parser.parse(str(raw_date), dayfirst=True).date()
        except Exception:
            return None


def handle_date_logic(extracted_date: date) -> tuple:
    """Handles date logic for issue and post dates."""
    today = date.today()
    if extracted_date:
        if extracted_date > today:
            return today, extracted_date
        else:
            return extracted_date, None
    return today, None


def check_duplicate_cheque(user, cheque_no: str) -> bool:
    """Checks if cheque number is duplicate."""
    return cheque.objects.filter(user=user, cheque_no=cheque_no).exists()


def save_cheque_record(user, cleaned_data: dict, image_file) -> cheque:
    """Saves the cheque record to DB."""
    return cheque.objects.create(
        user=user,
        cheque_no=cleaned_data['cheque_no'],
        payee=cleaned_data['payee'],
        amount=cleaned_data['amount'],
        issue_date=cleaned_data['issue_date'],
        post_date=cleaned_data['post_date'],
        description=cleaned_data['description'],
        Image=image_file,
        status='PENDING'
    )


def handle_balance_alert(user, cheque_record, payee: str, extracted_date, amount: float):
    """Creates alert if balance is low."""
    current_balance = get_actual_balance(user)
    if current_balance < amount:
        Alerts.objects.create(
            user=user,
            cheque=cheque_record,
            payee=payee,
            cheque_date=extracted_date or date.today(),
            alerts=f"⚠️ Low Balance Alert for Cheque #{cheque_record.cheque_no}"
        )


@csrf_exempt
def cheque_reader(request):
    """Main function to process cheque image and extract data."""
    try:
        # Step 1: Validate input
        input_data = validate_cheque_input(request)
        user = input_data['user']
        purpose = input_data['purpose']
        image_file = input_data['image_file']
        image_data = input_data['image_data']

        # Step 2: Prepare image
        base64_image = prepare_image_for_ai(image_data)

        # Step 3: Extract data via AI
        extracted = extract_cheque_data_via_ai(base64_image)

        # Step 4: Clean data
        payee = extracted.get('pay_name', 'Unknown')
        amount = clean_amount(extracted.get('amount', '0'))
        cheque_no = clean_micr(str(extracted.get('micr_line', '')))
        extracted_date = parse_date(extracted.get('date'))
        issue_date, post_date = handle_date_logic(extracted_date)

        # Step 5: Check duplicate
        if check_duplicate_cheque(user, cheque_no):
            return JsonResponse({
                "status": "error",
                "message": f"Cheque number {cheque_no} already exists for this user"
            }, status=400)

        # Step 6: Save record
        description = f"Payment of ₹{amount} to {payee} for {purpose}"
        cleaned_data = {
            'cheque_no': cheque_no,
            'payee': payee,
            'amount': amount,
            'issue_date': issue_date,
            'post_date': post_date,
            'description': description
        }
        new_record = save_cheque_record(user, cleaned_data, image_file)

        # Step 7: Handle alerts
        handle_balance_alert(user, new_record, payee, extracted_date, amount)

        return JsonResponse({
            "status": "success",
            "message": "Cheque saved successfully.",
            "cheque_no": cheque_no
        })

    except Exception as e:
        logger.error(f"UPLOAD ERROR: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(['GET'])
def list_of(request, username):
    """Fetches the Ledger History."""
    try:
        current_user = User.objects.get(username=username)
        user_cheques = cheque.objects.filter(user=current_user).order_by('-id')
        data = [{
            "id": c.id,
            "cheque_no": c.cheque_no,
            "payee": c.payee,
            "amount": float(c.amount),
            "description": c.description,
            "status": c.status,
            "date": str(c.post_date or c.issue_date or "N/A"),
            "image": request.build_absolute_uri(c.Image.url) if c.Image else None
        } for c in user_cheques]
        return JsonResponse({"status": "success", "cheques": data})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


def delete_old_alerts(user):
    """Deletes all existing alerts for the user."""
    Alerts.objects.filter(user=user).delete()


def generate_alerts(user, cheques, current_balance: float, today: date):
    """Generates new alerts based on cheque data."""
    for c in cheques:
        c_date = c.post_date or c.issue_date
        if not c_date or (c_date - today).days < 0:
            continue
        days_diff = (c_date - today).days
        if current_balance < c.amount:
            if days_diff == 0:
                msg = f"🚨 Due today: Balance ₹{current_balance} < ₹{c.amount}"
            else:
                msg = f"⚠️ May bounce in {days_diff} days (₹{current_balance} < ₹{c.amount})"
        else:
            if days_diff == 0:
                msg = "✅ Cheque clearance today"
            elif days_diff <= 3:
                msg = f"📅 Cheque clearance in {days_diff} days"
            else:
                msg = f"🕒 Upcoming cheque in {days_diff} days"
        Alerts.objects.create(
            user=user,
            cheque=c,
            payee=c.payee,
            cheque_date=c_date,
            alerts=msg
        )


def get_alert_data(user):
    """Fetches alert data for the user."""
    alerts = Alerts.objects.filter(user=user).order_by('cheque_date')
    return [{
        "date": str(a.date),
        "cheque_date": str(a.cheque_date),
        "payee_name": a.payee,
        "alerts": a.alerts
    } for a in alerts]


@api_view(['GET'])
def list_alerts(request, username):
    """Fetches and recalculates alerts."""
    try:
        current_user = User.objects.get(username=username)
        today = date.today()
        current_balance = get_actual_balance(current_user)

        # Step 1: Clear old alerts
        delete_old_alerts(current_user)

        # Step 2: Get pending cheques and generate alerts
        cheques = cheque.objects.filter(
            user=current_user,
            status='PENDING'
        )
        generate_alerts(current_user, cheques, current_balance, today)

        # Step 3: Return data
        data = get_alert_data(current_user)
        return JsonResponse({"status": "success", "alerts": data})

    except User.DoesNotExist:
        return JsonResponse({"status": "error", "message": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
def mark_as_cleared(request, cheque_id):
    """Manual Status Update."""
    try:
        c = cheque.objects.get(id=cheque_id)
        new_status = request.data.get('status', 'CLEARED')
        c.status = new_status
        c.save()
        if new_status == 'CLEARED':
            Alerts.objects.filter(cheque=c).delete()
            msg = "Cheque marked as CLEARED. Alerts removed."
        else:
            msg = "Cheque reopened as PENDING. Alerts will be recalculated."
        return JsonResponse({
            "status": "success",
            "message": msg,
            "current_status": c.status
        })
    except cheque.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Cheque not found"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
def update_cheque_number(request, cheque_id):
    """Updates the cheque number."""
    try:
        instance = cheque.objects.get(id=cheque_id)
        current_user = instance.user
        new_no = request.data.get('cheque_no')
        if not new_no:
            return JsonResponse({"status": "error", "message": "No number provided"}, status=400)
        is_duplicate = cheque.objects.filter(
            user=current_user, cheque_no=new_no
        ).exclude(id=cheque_id).exists()
        with transaction.atomic():
            instance.cheque_no = new_no
            instance.save()
        if is_duplicate:
            Alerts.objects.update_or_create(
                user=current_user,
                cheque=instance,
                defaults={
                    'alerts': f"🚨 Duplicate Cheque No: {new_no} detected!",
                    'payee': instance.payee,
                    'cheque_date': instance.post_date or instance.issue_date or date.today()
                }
            )
            msg = "Updated successfully. Duplicate alert generated."
        else:
            Alerts.objects.filter(cheque=instance, alerts__icontains="Duplicate").delete()
            msg = "Updated successfully."
        return JsonResponse({"status": "success", "message": msg})
    except cheque.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Cheque not found"}, status=404)
    except Exception as e:
        logger.error(f"UPDATE NUMBER ERROR: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


def create_admin():
    """Creates an admin user if it doesn't exist."""
    user_model = get_user_model()
    if not user_model.objects.filter(username='admin').exists():
        user_model.objects.create_superuser('admin', 'admin@example.com', 'Admin123!')
        return HttpResponse("Success! User 'admin' created.")
    return HttpResponse("User 'admin' already exists.")