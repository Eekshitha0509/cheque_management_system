import base64
import json
import os
import logging
import re
from datetime import date, timedelta
from dateutil import parser

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db.models import Q
from rest_framework.decorators import api_view
from groq import Groq
from .models import cheque, Alerts

logger = logging.getLogger(__name__)

# Initialize Groq
client = Groq(api_key="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")
User = get_user_model()

@csrf_exempt
def cheque_reader(request):
    if request.method == 'POST':
        # 1. Extract frontend data
        username = request.POST.get('username')
        purpose = request.POST.get('purpose', 'General Payment')
        image_file = request.FILES.get('cheque_image')

        if not all([username, image_file]):
            return JsonResponse({
                "status": "error", 
                "message": "Missing required fields: username and cheque_image"
            }, status=400)

        try:
            # 2. Find user
            try:
                current_user = User.objects.get(username=username)
            except User.DoesNotExist:
                return JsonResponse({
                    "status": "error", 
                    "message": f"User '{username}' not found."
                }, status=404)

            # 3. Process Image
            image_data = image_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')

            # 4. AI Extraction with Improved Prompt
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": (
                                    "Extract 'date', 'amount', 'chequenumber', and 'pay_name' from this cheque. "
                                    "The 'chequenumber' is exactly the first 6 digits found in the MICR line at the bottom. "
                                    "If a field is missing or unreadable, return 0 for numbers and 'Unknown' for text. "
                                    "Return ONLY valid JSON."
                                )
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )

            # 5. Parse Data and Sanitization
            extracted = json.loads(completion.choices[0].message.content)
            print("AI OUTPUT:", extracted)
            payee = extracted.get('pay_name', 'Unknown')

            # robustness check for chequenumber 0 
            raw_cheque_no = str(extracted.get('chequenumber', '0')).strip()
            clean_no_str = re.sub(r"\D", "", raw_cheque_no) # Remove all non-digits
            # Using int conversion for database storage compatibility (IntegerField)
            cheque_no = int(clean_no_str[:6]) if clean_no_str else 0
            
            # and amount
            raw_amount = str(extracted.get('amount', '0'))
            clean_amount_str = re.sub(r"[^\d.]", "", raw_amount)
            try:
                clean_amount = float(clean_amount_str)
            except ValueError:
                clean_amount = 0.0

            raw_date = extracted.get('date')
            cheque_date = None
            if raw_date and raw_date != "0":
                try:
                    cheque_date = parser.parse(str(raw_date), dayfirst=True).date()
                except (ValueError, TypeError):
                    cheque_date = None

            today = date.today()
            issue_date = None
            post_date = None

            if cheque_date:
                if cheque_date <= today:
                    issue_date = cheque_date
                else:
                    post_date = cheque_date

            # ========================================================
            # --- 6. DUPLICATE CHECK: TRANSACTION SIGNATURE & ALERT PREVENTION (FIXED) ---
            # We enforce uniqueness by checking the combination of Payee, Amount, and Date.
            # This definitive signature blocks physical duplicates even if AI misread the number.

            is_duplicate = cheque.objects.filter(
                user=current_user,
                payee=payee,
                amount=clean_amount,
                cheque_no=cheque_no
            ).filter(
                Q(issue_date=issue_date) | Q(post_date=post_date)
            ).exists()

            if is_duplicate:
                # We block further processing. The clutter prevention is active.

                # FALLBACK ALERT LOGIC (moved here):
                # If AI missed the number *this time* (0), but it is a duplicate transaction,
                # we block the duplicate record and create a specific alert notifying the user
                # to verify the number from the image. We also populate the payee field.
                if cheque_no == 0:
                    Alerts.objects.create(
                        user=current_user,
                        payee=payee, # Populate payee field
                        date=today,
                        cheque_date=cheque_date,
                        alerts=(
                            f"Verification Alert: System unable to read cheque number for unverified "
                            f"duplicate payment signature (₹{clean_amount} to {payee}, Date: {cheque_date or 'Unknown'})."
                        )
                    )

                return JsonResponse({
                    "status": "error",
                    "message": (
                        "Duplicate Entry Blocked: Clutter prevention active. A unique cheque "
                        "transaction signature with this Payee, Amount, and Date has already been recorded."
                    ),
                }, status=409)
            # ========================================================

            # 7. Final Prep and Save
            generated_desc = f"Payment of ₹{clean_amount} to {payee} for {purpose}."
            
            extension = os.path.splitext(image_file.name)[1] or ".jpg"
            # safe names
            safe_payee = re.sub(r'\W+', '_', payee)
            filename = f"{safe_payee}_{today}{extension}"

            cheque_status = "Pending"
            if issue_date and issue_date < today:
                cheque_status = "Cleared"

            new_record = cheque.objects.create(
                user=current_user,
                cheque_no=cheque_no,
                payee=payee,
                amount=clean_amount,
                issue_date=issue_date,
                post_date=post_date,
                description=generated_desc,
                Image=ContentFile(image_data, name=filename),
                status=cheque_status
            )

            # ========================================================
            # --- 8. ALERT LOGIC (FIXED): PDCs AND EXPIRED ---
            # Now that duplicates are definitively blocked, this section will only run
            # once for a unique logical cheque.
            if post_date:
                days_left = (post_date - today).days
                if 0 <= days_left <= 3:
                    Alerts.objects.create(
                        user=current_user,
                        payee=payee, # Populate payee field
                        date=today,
                        cheque_date=post_date,
                        alerts=f"Cheque Clearance in {days_left} days"
                    )
                
                if today >= post_date + timedelta(days=90):
                    Alerts.objects.create(
                        user=current_user,
                        payee=payee, # Populate payee field
                        date=today,
                        cheque_date=post_date,
                        alerts="Cheque is expired"
                    )
            # ========================================================

            return JsonResponse({
                "status": "success",
                "message": "Cheque processed and saved.",
                "data": {
                    "id": new_record.id,
                    "cheque_no": cheque_no,
                    "payee": payee,
                    "amount": clean_amount
                }
            })

        except Exception as e:
            logger.error(f"CHEQUE READER ERROR: {str(e)}")
            return JsonResponse({"status": "error", "message": f"Internal Error: {str(e)}"}, status=500)

    return JsonResponse({"status": "error", "message": "POST request required"}, status=405)


@api_view(['GET'])
def list_of(request, username):
    try:
        user = User.objects.get(username=username)
        user_cheques = cheque.objects.filter(user=user).order_by('-id')

        cheque_data = []
        for c in user_cheques:
            cheque_data.append({
                "id": c.id,
                "cheque_no" : c.cheque_no,
                "payee": c.payee,
                "amount": float(c.amount),
                "description": c.description,
                "status": c.status,
                "date": str(c.issue_date or c.post_date or ""),
                "image": c.Image.url if c.Image else None
            })

        return JsonResponse({
            "status": "success",
            "cheques": cheque_data
        })

    except User.DoesNotExist:
        return JsonResponse({"status": "error", "message": "User not found"}, status=404)
    except Exception as e:
        print("CHEQUE LIST ERROR:", str(e))
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    

@api_view(['GET'])
def list_alerts(request, username):

    user = User.objects.get(username=username)

    alerts = Alerts.objects.filter(user=user).order_by('-id')

    data = []

    for a in alerts:
        data.append({
            "date": str(a.date), 
            "cheque_date": str(a.cheque_date),
            "payee_name":a.payee,
            "alerts": a.alerts
        })

    return JsonResponse({
        "status": "success",
        "alerts": data
    })