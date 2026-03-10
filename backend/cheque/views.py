import base64
import json
from datetime import date
from dateutil import parser
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from groq import Groq
from django.shortcuts import get_list_or_404
from .models import cheque
from django.http import JsonResponse
from rest_framework.decorators import api_view
import logging
import os
from django.core.files.base import ContentFile


logger = logging.getLogger(__name__)


# 1. Initialize Groq and the Custom User Model
client = Groq(api_key="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")
User = get_user_model()

@csrf_exempt
def cheque_reader(request):
    """
    Receives username, purpose, and cheque_image.
    Extracts data using AI and saves a mapped record with a custom description.
    """
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
            # 3. Find the specific user from your account app
            try:
                current_user = User.objects.get(username=username)
            except User.DoesNotExist:
                return JsonResponse({
                    "status": "error", 
                    "message": f"User '{username}' not found."
                }, status=404)

            # 4. Process Image for AI
            image_data = image_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')

            # 5. Groq AI Extraction (Llama 4 Scout)
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "Extract 'date', 'amount', and 'pay_name' from this cheque. Return ONLY JSON."
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

            # 6. Parse and Clean AI Data
            extracted = json.loads(completion.choices[0].message.content)
            payee = extracted.get('pay_name', 'Unknown')
            
            # Remove commas from amount for FloatField compatibility
            raw_amount = str(extracted.get('amount', '0'))
            clean_amount_str = raw_amount.replace('₹', '').replace('Rs', '').replace(',', '').strip()

            try:
                clean_amount = float(clean_amount_str) # Now it's just '2500000'
            except ValueError:
                clean_amount = 0.0

            # Parse date and determine if it's Issued or Post-Dated
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

            # 7. Construct the final description sentence
            # Example: "Payment of 2235000.0 to Ravuri Manish Ojha for Office Rent."
            generated_desc = f"Payment of {clean_amount} to {payee} for {purpose}."

            # 8. Save to PostgreSQL

            extension = os.path.splitext(image_file.name)[1]
            safe_payee = payee.replace(" ", "_")

            filename = f"{safe_payee}{extension}"

            new_record = cheque.objects.create(
                user=current_user,
                payee=payee,
                amount=clean_amount,
                issue_date=issue_date,
                post_date=post_date,
                description=generated_desc,
                Image=ContentFile(image_data, name=filename),
                status="Pending"
)

            return JsonResponse({
                "status": "success",
                "message": "Cheque processed and saved.",
                "data": {
                    "id": new_record.id,
                    "description": generated_desc,
                    "payee": payee,
                    "amount": clean_amount
                }
            })

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse({"status": "error", "message": "POST request required"}, status=405)

# Set up logging to see errors in your terminal

User = get_user_model()

def list_of(request, username):

    try:

        # Get the user first
        user = User.objects.get(username=username)

        # Then fetch cheques using FK
        user_cheques = cheque.objects.filter(user=user).order_by('-id')

        cheque_data = []

        for c in user_cheques:

            cheque_data.append({
            "id": c.id,
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

        return JsonResponse({
            "status": "error",
            "message": "User not found"
        }, status=404)

    except Exception as e:

        print("CHEQUE LIST ERROR:", str(e))

        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)