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

        is_duplicate = False
        if cheque_no != 0:
            is_duplicate = cheque.objects.filter(
                user=current_user, 
                cheque_no=cheque_no
            ).exists()

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

        if is_duplicate:
            Alerts.objects.create(
                user=current_user,
                cheque=new_record,
                payee=payee,
                cheque_date=cheque_date or today,
                alerts=f"🚫 DUPLICATE DETECTED: Cheque #{cheque_no} already exists in your ledger."
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
        import traceback
        logger.error(traceback.format_exc()) # This prints the FULL error to your terminal
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


from django.db.models import Q
from datetime import date
from django.http import JsonResponse
from rest_framework.decorators import api_view

@api_view(['GET'])
def list_alerts(request, username):
    """Dynamic Notifications with Automatic Cleanup and Generation."""
    try:
        current_user = User.objects.get(username=username)
        today = date.today()
        # Ensure this function returns a numeric value
        current_balance = get_actual_balance(current_user)

        # 1. Cleanup: Auto-remove expired alerts (past the due date)
        Alerts.objects.filter(user=current_user, cheque_date__lt=today).delete()

        # 2. Fetch ALL relevant PENDING cheques for this user
        # We fetch all pending cheques that are due today or in the future
        relevant_cheques = cheque.objects.filter(
            user=current_user, 
            status='PENDING'
        ).filter(
            Q(post_date__gte=today) | Q(issue_date__gte=today)
        )

        for c in relevant_cheques:
            # Use whichever date is available for the calculation
            c_date = c.post_date or c.issue_date
            if not c_date:
                continue
                
            days_diff = (c_date - today).days
            
            # Logic: We only care about things happening in the next 3 days
            if 0 <= days_diff <= 3:
                # PRIORITY A: BOUNCE ALERTS (Balance is low)
                if current_balance < c.amount:
                    if days_diff == 0:
                        msg = f"🚨 Due today: Balance (₹{current_balance}) is insufficient for ₹{c.amount}!"
                    else:
                        msg = f"⚠️ May bounce: Balance (₹{current_balance}) is lower than ₹{c.amount} due in {days_diff} days."
                
                # PRIORITY B: STANDARD REMINDERS (Balance is okay)
                else:
                    if days_diff == 0:
                        msg = "✅ Cheque Clearance today"
                    else:
                        msg = f"📅 Cheque Clearance in {days_diff} days"

                # 3. Save or Update the Alert
                # Note: We use the 'cheque' instance as the unique identifier
                Alerts.objects.update_or_create(
                    user=current_user, 
                    cheque=c,
                    defaults={
                        'alerts': msg, 
                        'payee': c.payee, 
                        'cheque_date': c_date
                    }
                )

        # 4. Final Cleanup: If a cheque was cleared/deleted, remove its alert
        # (This handles cases where the user marks a cheque as CLEARED in the history tab)
        active_cheque_ids = relevant_cheques.values_list('id', flat=True)
        Alerts.objects.filter(user=current_user).exclude(cheque_id__in=active_cheque_ids).delete()

        # 5. Return the list
        alerts_list = Alerts.objects.filter(user=current_user).order_by('cheque_date')
        data = [
            {
                "date": str(a.date), 
                "cheque_date": str(a.cheque_date), 
                "payee_name": a.payee, 
                "alerts": a.alerts
            } for a in alerts_list
        ]
        
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