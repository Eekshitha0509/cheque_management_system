import base64
import json
import os
import logging
import re
from datetime import date
from dateutil import parser

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db.models import Q
from rest_framework.decorators import api_view
from groq import Groq

# Import your specific models
from .models import cheque, Alerts
from account.models import Account 

logger = logging.getLogger(__name__)
User = get_user_model()

# Initialize Groq - Update with your actual API key
client = Groq(api_key="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")

# --- HELPER FUNCTIONS ---

def get_actual_balance(user):
    """Fetches real balance from the Account table."""
    try:
        account_record = Account.objects.get(user=user)
        return float(account_record.balance)
    except Account.DoesNotExist:
        return 0.0

# --- VIEW FUNCTIONS ---

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
        base64_image = base64.b64encode(image_data).decode('utf-8')

        # --- REFINED AI PROMPT ---
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": (
                            "Carefully extract these fields from the cheque image: "
                            "1. 'pay_name': The person or company being paid. "
                            "2. 'amount': The numerical value. "
                            "3. 'date': The date written on the cheque. "
                            "4. 'chequenumber': Look ONLY at the bottom MICR line. It is the FIRST 6-digit number in quotes or brackets (e.g., '000123'). "
                            "Return ONLY valid JSON."
                        )
                    },
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        extracted = json.loads(completion.choices[0].message.content)
        
        # --- ROBUST EXTRACTION LOGIC ---
        
        # 1. Clean Cheque Number: Ensure we only get 6 digits
        raw_cheque_no = str(extracted.get('chequenumber', '0'))
        # Use regex to find the first 6-digit sequence if AI included extra text
        match = re.search(r'(\d{6})', raw_cheque_no)
        cheque_no = int(match.group(1)) if match else 0
        
        # 2. Clean Amount
        raw_amount = str(extracted.get('amount', '0'))
        clean_amount = float(re.sub(r"[^\d.]", "", raw_amount) or 0.0)

        # 3. Payee
        payee = extracted.get('pay_name', 'Unknown')

        # 4. Date Logic
        raw_date = extracted.get('date')
        cheque_date = None
        if raw_date and raw_date != "0":
            try:
                cheque_date = parser.parse(str(raw_date), dayfirst=True).date()
            except: 
                cheque_date = date.today()

        today = date.today()
        issue_date = cheque_date if cheque_date <= today else None
        post_date = cheque_date if cheque_date > today else None

        # --- SAVE & ALERTS ---
        new_record = cheque.objects.create(
            user=current_user,
            cheque_no=cheque_no, # Now cleaner
            payee=payee,
            amount=clean_amount,
            issue_date=issue_date,
            post_date=post_date,
            description=f"Payment of ₹{clean_amount} to {payee} for {purpose}",
            Image=ContentFile(image_data, name=f"{payee}_{today}.jpg"),
            status='PENDING'
        )

        # Alert Logic (Your Structured Design)
        current_balance = get_actual_balance(current_user)
        if cheque_date >= today and current_balance < clean_amount:
            days_diff = (cheque_date - today).days
            if days_diff <= 3:
                Alerts.objects.create(
                    user=current_user,
                    cheque=new_record,
                    payee=payee,
                    cheque_date=cheque_date,
                    alerts=f"⚠️ Low Balance Alert for Cheque #{cheque_no}"
                )

        return JsonResponse({"status": "success", "message": "Cheque saved."})

    except Exception as e:
        logger.error(f"CHEQUE READER ERROR: {str(e)}")
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
            "image": c.Image.url if c.Image else None
        } for c in user_cheques]

        return JsonResponse({"status": "success", "cheques": data})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(['GET'])
def list_alerts(request, username):
    """Dynamic Notifications with Automatic Cleanup."""
    try:
        current_user = User.objects.get(username=username)
        today = date.today()
        current_balance = get_actual_balance(current_user)

        #  After Due Date: Auto-remove expired alerts
        Alerts.objects.filter(user=current_user, cheque_date__lt=today).delete()

        # Before &  On Due Date: Process PENDING risky cheques
        risky_cheques = cheque.objects.filter(
            user=current_user, status='PENDING', amount__gt=current_balance
        ).filter(Q(post_date__gte=today) | Q(issue_date__gte=today) | Q(post_date__gte>=today)) 

        for c in risky_cheques:
    # Use whichever date is available
            c_date = c.post_date or c.issue_date
            days_diff = (c_date - today).days
            
            # 1. PRIORITY: BOUNCE ALERTS (Balance is low)
            if current_balance < c.amount:
                if days_diff == 0:
                    msg = f"🚨 Due today: Balance (₹{current_balance}) is insufficient for ₹{c.amount}!"
                elif 0 < days_diff <= 3:
                    msg = f"⚠️ May bounce: Balance (₹{current_balance}) is lower than ₹{c.amount} due in {days_diff} days."
                else:
                    continue 

            # 2. SECONDARY: STANDARD CLEARANCE REMINDERS (Balance is okay)
            else:
                if days_diff == 0:
                    msg = "✅ Cheque Clearance today"
                elif 0 < days_diff <= 3:
                    msg = f"📅 Cheque Clearance in {days_diff} days"
                else:
                    # Keep the notifications clean; don't show reminders for distant dates
                    continue

            Alerts.objects.update_or_create(
                user=current_user, cheque=c,
                defaults={'alerts': msg, 'payee': c.payee, 'cheque_date': c_date}
            )

        alerts_list = Alerts.objects.filter(user=current_user).order_by('-id')
        data = [{"date": str(a.date), "cheque_date": str(a.cheque_date), "payee_name": a.payee, "alerts": a.alerts} for a in alerts_list]
        return JsonResponse({"status": "success", "alerts": data})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(['POST'])
def mark_as_cleared(request, cheque_id):
    """Manual Status Update: Ledger Truth -> Notification Cleanup."""
    try:
        c = cheque.objects.get(id=cheque_id)
        c.status = 'CLEARED'
        c.save()
        
        # Immediately remove associated alert
        Alerts.objects.filter(cheque=c).delete()
        
        return JsonResponse({"status": "success", "message": "Marked as CLEARED."})
    except cheque.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Cheque not found"}, status=404)