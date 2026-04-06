import base64
import json
import os
import logging
import re
from datetime import date
from dateutil import parser
from PIL import Image
import io
import cloudinary
import cloudinary.uploader
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db.models import Q
from rest_framework.decorators import api_view
from groq import Groq
from django.core.files.storage import default_storage
# Import your specific models
from .models import cheque, Alerts
from account.models import Account 

logger = logging.getLogger(__name__)
User = get_user_model()

from decouple import config
import os

# Use decouple's config() - it's the gold standard for Django deployment
# It looks at .env locally AND Render Environment Variables automatically
GRO_KEY = config("GROQ_API_KEY", default=os.environ.get("GROQ_API_KEY"))

if GRO_KEY:
    client = Groq(api_key=GRO_KEY)
else:
    client = None
    print("Warning: GROQ_API_KEY not found. AI features will be disabled.")
# --- HELPER FUNCTIONS ---

def get_actual_balance(user):
    """Fetches real balance from the Account table."""
    try:
        account_record = Account.objects.get(user=user)
        return float(account_record.balance)
    except Account.DoesNotExist:
        return 0.0

# --- VIEW FUNCTIONS ---

from PIL import Image
import io

def compress_image(image_file):
    img = Image.open(image_file)
    
    # ✅ Resize (VERY IMPORTANT)
    img = img.resize((800, 400))   # you can tweak (600x300 also works)

    # ✅ Convert to RGB (important for JPEG)
    img = img.convert("RGB")

    # ✅ Compress
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=40)  # 30–50 is good

    return base64.b64encode(buffer.getvalue()).decode('utf-8')

@csrf_exempt
@csrf_exempt
def cheque_reader(request):
    if request.method != 'POST':
        return JsonResponse({"status": "error", "message": "POST required"}, status=405)

    try:
        username = request.POST.get('username')
        purpose = request.POST.get('purpose', 'General Payment')
        image_file = request.FILES.get('cheque_image')

        if not all([username, image_file]):
            return JsonResponse({"status": "error", "message": "Missing fields"}, status=400)

        current_user = User.objects.get(username=username)
        image_data = image_file.read()
        
        # Compress for AI processing
        base64_image = compress_image(io.BytesIO(image_data))

        # --- CLOUDINARY MANUAL UPLOAD ---
        # This bypasses the 'AttributeError' by uploading before creating the DB record
        cloudinary_url = None
        if image_file:
            upload_result = cloudinary.uploader.upload(
                ContentFile(image_data),
                folder="cheques/",
                public_id=f"{username}_{date.today()}_{re.sub(r'[^a-zA-Z0-0]', '', purpose[:10])}"
            )
            cloudinary_url = upload_result.get('secure_url')

        # --- AI EXTRACTION ---
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract 'pay_name', 'amount', 'date', and 6-digit 'chequenumber' from the MICR line. Return ONLY JSON."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        extracted = json.loads(completion.choices[0].message.content)
        
        # Clean extracted data
        raw_cheque_no = str(extracted.get('chequenumber', '0'))
        match = re.search(r'(\d{6})', raw_cheque_no)
        cheque_no = int(match.group(1)) if match else 0
        
        raw_amount = str(extracted.get('amount', '0'))
        clean_amount = float(re.sub(r"[^\d.]", "", raw_amount) or 0.0)
        payee = extracted.get('pay_name', 'Unknown')

        raw_date = extracted.get('date')
        cheque_date = date.today()
        if raw_date and raw_date != "0":
            try:
                cheque_date = parser.parse(str(raw_date), dayfirst=True).date()
            except: pass

        today = date.today()
        issue_date = cheque_date if cheque_date <= today else None
        post_date = cheque_date if cheque_date > today else None

        is_duplicate = cheque.objects.filter(user=current_user, cheque_no=cheque_no).exists() if cheque_no != 0 else False

        # --- SAVE TO SUPABASE ---
        new_record = cheque.objects.create(
            user=current_user,
            cheque_no=cheque_no,
            payee=payee,
            amount=clean_amount,
            issue_date=issue_date,
            post_date=post_date,
            description=f"Payment of ₹{clean_amount} to {payee} for {purpose}",
            Image=cloudinary_url, # Storing the direct URL string
            status='PENDING'
        )

        # --- ALERTS ---
        if is_duplicate:
            Alerts.objects.create(
                user=current_user,
                cheque=new_record,
                payee=payee,
                cheque_date=cheque_date,
                alerts=f"🚫 DUPLICATE DETECTED: Cheque #{cheque_no} already exists."
            )

        current_balance = get_actual_balance(current_user)
        if cheque_date >= today and current_balance < clean_amount:
            Alerts.objects.create(
                user=current_user,
                cheque=new_record,
                payee=payee,
                cheque_date=cheque_date,
                alerts=f"⚠️ Low Balance Alert for Cheque #{cheque_no}"
            )

        return JsonResponse({"status": "success", "message": "Cheque saved and uploaded to Cloudinary."})

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
            "date": str(c.issue_date or c.post_date or "N/A"),
            "image": str(c.Image) if c.Image else None
        } for c in user_cheques]

        return JsonResponse({"status": "success", "cheques": data})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


from django.db.models import Q
from datetime import date
from django.http import JsonResponse
from rest_framework.decorators import api_view

@api_view(['GET'])
def list_alerts(request, username):
    try:
        current_user = User.objects.get(username=username)
        today = date.today()
        current_balance = get_actual_balance(current_user)

        # 1. REMOVE ALL OLD ALERTS (fresh calculation every time)
        Alerts.objects.filter(user=current_user).delete()

        # 2. Get all pending cheques
        cheques = cheque.objects.filter(
            user=current_user,
            status='PENDING'
        )

        for c in cheques:
            c_date = c.post_date or c.issue_date
            if not c_date:
                continue

            days_diff = (c_date - today).days

            # Only future or today cheques
            if days_diff < 0:
                continue

            # --- ALERT LOGIC ---

            # 🔴 Low balance alert
            if current_balance < c.amount:
                if days_diff == 0:
                    msg = f"🚨 Due today: Balance ₹{current_balance} < ₹{c.amount}"
                else:
                    msg = f"⚠️ May bounce in {days_diff} days (₹{current_balance} < ₹{c.amount})"

            # 🟡 Normal alerts
            else:
                if days_diff == 0:
                    msg = "✅ Cheque clearance today"
                elif days_diff <= 3:
                    msg = f"📅 Cheque clearance in {days_diff} days"
                else:
                    msg = f"🕒 Upcoming cheque in {days_diff} days"

            # 3. Save alert
            Alerts.objects.create(
                user=current_user,
                cheque=c,
                payee=c.payee,
                cheque_date=c_date,
                alerts=msg
            )

        # 4. Return alerts
        alerts = Alerts.objects.filter(user=current_user).order_by('cheque_date')

        data = [{
            "date": str(a.date),
            "cheque_date": str(a.cheque_date),
            "payee_name": a.payee,
            "alerts": a.alerts
        } for a in alerts]

        return JsonResponse({"status": "success", "alerts": data})

    except User.DoesNotExist:
        return JsonResponse({"status": "error", "message": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@api_view(['POST'])
def mark_as_cleared(request, cheque_id):
    """
    Manual Status Update: Ledger Truth -> Notification Cleanup.
    Now supports toggling between CLEARED and PENDING.
    """
    try:
        c = cheque.objects.get(id=cheque_id)
        
        # Get the status from the request body (sent by React)
        # Default to 'CLEARED' if no status is provided in the POST
        new_status = request.data.get('status', 'CLEARED')
        
        c.status = new_status
        c.save()
        
        if new_status == 'CLEARED':
            # Immediately remove associated alerts if cleared
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
    """
    Updates the cheque number manually and checks for duplicates.
    """
    try:
        # 1. Fetch the cheque instance
        instance = cheque.objects.get(id=cheque_id)
        current_user = instance.user
        
        # 2. Get the new number from the request body
        new_no = request.data.get('cheque_no')
        
        if not new_no:
            return JsonResponse({"status": "error", "message": "No number provided"}, status=400)

        # 3. DUPLICATE CHECK
        # Search for any OTHER cheque belonging to this user with the same number
        is_duplicate = cheque.objects.filter(
            user=current_user, 
            cheque_no=new_no
        ).exclude(id=cheque_id).exists()

        # 4. Update the instance
        instance.cheque_no = new_no
        instance.save()

        # 5. Handle Duplicate Alert
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
            # If it's no longer a duplicate (user fixed it), remove the duplicate alert
            Alerts.objects.filter(cheque=instance, alerts__icontains="Duplicate").delete()
            msg = "Updated successfully."

        return JsonResponse({"status": "success", "message": msg})
        
    except cheque.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Cheque not found"}, status=404)
    except Exception as e:
        logger.error(f"UPDATE NUMBER ERROR: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    
from django.contrib.auth import get_user_model
from django.http import HttpResponse

def create_admin(request):
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'AdminPass123!')
        return HttpResponse("Success! User 'admin' created.")
    return HttpResponse("User 'admin' already exists.")