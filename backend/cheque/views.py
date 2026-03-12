import base64
import json
import os
import logging
from datetime import date
from dateutil import parser
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db.models import Q  # Essential for the duplicate check
from rest_framework.decorators import api_view
from groq import Groq
from datetime import timedelta
from .models import cheque,Alerts

logger = logging.getLogger(__name__)

# 1. Initialize Groq and the Custom User Model
client = Groq(api_key="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")
User = get_user_model()

@csrf_exempt
def cheque_reader(request):
    if request.method == 'POST':
        # 2. Extract frontend data
        username = request.POST.get('username')
        purpose = request.POST.get('purpose', 'General Payment')
        image_file = request.FILES.get('cheque_image')

        if not all([username, image_file]):
            return JsonResponse({
                "status": "error", 
                "message": "Missing required fields: username and cheque_image"
            }, status=400)

        try:
            # 3. Find user
            try:
                current_user = User.objects.get(username=username)
            except User.DoesNotExist:
                return JsonResponse({
                    "status": "error", 
                    "message": f"User '{username}' not found."
                }, status=404)

            # 4. Process Image
            image_data = image_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')

            # 5. AI Extraction
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "Extract 'date', 'amount','chequenumber' and 'pay_name' from this cheque. Return ONLY JSON."
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

            # 6. Parse Data
            extracted = json.loads(completion.choices[0].message.content)
            print("AI OUTPUT:", extracted)
            payee = extracted.get('pay_name', 'Unknown')

            # Extract cheque number
            raw_cheque_no = str(extracted.get('chequenumber', '')).strip()
            clean_no = raw_cheque_no.replace(" ", "")

                # keep only first 6 digits
            cheque_no = clean_no[:6]
            raw_amount = str(extracted.get('amount', '0'))
            clean_amount_str = re.sub(r"[^\d.]", "", raw_amount)

            try:
                clean_amount = float(clean_amount_str)
            except:
                clean_amount = 0.0

            raw_date = extracted.get('date')
            cheque_date = parser.parse(raw_date, dayfirst=True).date() if raw_date else None
            today = date.today()

            issue_date = None
            post_date = None
            if cheque_date:
                if cheque_date <= today:
                    issue_date = cheque_date
                else:
                    post_date = cheque_date

            # --- CORRECTED DUPLICATE CHECK ---
            # Use 'current_user' (the object) instead of 'username' (the string)
            is_duplicate = cheque.objects.filter(
                user=current_user,
                payee=payee,
                amount=clean_amount
            ).filter(
                Q(issue_date=issue_date) | Q(post_date=post_date)
            ).exists()

            if is_duplicate:
                return JsonResponse({
                    "status": "error",
                    "message": "Duplicate Entry: This cheque has already been digitized."
                }, status=409)

            # 7. Construct description
            generated_desc = f"Payment of ₹{clean_amount} to {payee} for {purpose}."

            # 8. Save with custom filename
            extension = os.path.splitext(image_file.name)[1]
            safe_payee = payee.replace(" ", "_")
            filename = f"{safe_payee}_{today}{extension}"

            # alert system
            cheque_status = "Pending"

            if issue_date and issue_date < date.today():
                cheque_status = "Cleared"

            new_record = cheque.objects.create(
                user=current_user,
                cheque_no=cheque_no,
                payee=payee,
                amount=clean_amount,
                issue_date=issue_date,
                post_date=post_date,
                description=generated_desc,
                Image=ContentFile(image_data, name=filename), # Saves correctly to media/cheques/
                status=cheque_status
            )

            if post_date:
                days_left = (post_date - date.today()).days
                if 0 <= days_left <= 3:
                    new_alert = Alerts.objects.create(
                        user=current_user,
                        date = date.today(),
                        cheque_date = post_date,
                        alerts = f"Cheque Clearance in {days_left} days"
                    )
      
                if date.today() >= post_date + timedelta(days=90):
                    new_alert = Alerts.objects.create(
                        user=current_user,
                        date = date.today(),
                        cheque_date = post_date,
                        alerts = f"cheque is expired"
                    )

            return JsonResponse({
                "status": "success",
                "message": "Cheque processed and saved.",
                "data": {
                    "id": new_record.id,
                    "cheque_no" : cheque_no,
                    "description": generated_desc,
                    "payee": payee,
                    "amount": clean_amount
                }
            })

        except Exception as e:
            logger.error(f"CHEQUE READER ERROR: {str(e)}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

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
            "alerts": a.alerts
        })

    return JsonResponse({
        "status": "success",
        "alerts": data
    })