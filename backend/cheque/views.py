import cv2
import pytesseract
import numpy as np
import re
import json
from datetime import datetime
from groq import Groq
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from .models import cheque

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Groq client
client = Groq(api_key="YOUR_GROQ_API_KEY")


# ---------------- OCR UTILITY ----------------
def ocr_region(region):
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray,(3,3),0)

    text = pytesseract.image_to_string(
        gray,
        config="--oem 3 --psm 6"
    )

    return text.strip()


# ---------------- CHEQUE NUMBER ----------------
def detect_cheque_number(image):

    h,w,_ = image.shape

    micr = image[int(h*0.75):h,0:w]

    text = ocr_region(micr)

    nums = re.findall(r"\d+",text)

    for n in nums:
        if len(n)>=6:
            return n[:6]

    return None


# ---------------- DATE ----------------
def detect_date(image):

    h,w,_ = image.shape

    region = image[int(h*0.05):int(h*0.20),int(w*0.70):w]

    text = ocr_region(region)

    match = re.search(r'\d{2}[/-]\d{2}[/-]\d{4}',text)

    if match:
        return match.group()

    return None


# ---------------- AMOUNT ----------------
def detect_amount(image):

    h,w,_ = image.shape

    region = image[int(h*0.35):int(h*0.55),int(w*0.60):w]

    text = ocr_region(region)

    match = re.search(r'\d{2,7}',text)

    if match:
        return match.group()

    return None


# ---------------- PAYEE ----------------
def detect_payee(image):

    h,w,_ = image.shape

    region = image[int(h*0.25):int(h*0.40),int(w*0.10):int(w*0.80)]

    text = ocr_region(region)

    return text


# ---------------- BANK ----------------
def detect_bank(text):

    banks = [
        "State Bank of India",
        "HDFC Bank",
        "ICICI Bank",
        "Axis Bank",
        "Punjab National Bank",
        "Bank of Baroda",
        "Canara Bank",
        "Union Bank of India"
    ]

    for bank in banks:
        if bank.lower() in text.lower():
            return bank

    return None


# ---------------- GROQ CLEANUP ----------------
def clean_with_groq(raw_text):

    prompt = f"""
Clean the following OCR text and extract cheque information.

Return ONLY JSON:

{{
"bank":"",
"payee":"",
"amount":"",
"date":"",
"cheque_number":"",
"account_number":"",
"ifsc":""
}}

OCR TEXT:
{raw_text}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role":"user","content":prompt}],
        temperature=0
    )

    result = response.choices[0].message.content

    try:
        return json.loads(result)
    except:
        return {}


# ---------------- MAIN API ----------------
@csrf_exempt
@api_view(["POST"])
def upload_cheque(request):

    image_file = request.FILES.get("image")
    purpose = request.data.get("purpose")

    if not image_file:
        return Response({"error":"No image uploaded"})

    try:

        file_bytes = image_file.read()

        np_arr = np.frombuffer(file_bytes,np.uint8)

        image = cv2.imdecode(np_arr,cv2.IMREAD_COLOR)

        image = cv2.resize(image,None,fx=2,fy=2)

        # FULL OCR
        full_text = pytesseract.image_to_string(image)

        print("RAW OCR:",full_text)

        # REGION OCR
        cheque_number = detect_cheque_number(image)
        date = detect_date(image)
        amount = detect_amount(image)
        payee = detect_payee(image)

        bank = detect_bank(full_text)

        # GROQ cleanup
        ai_data = clean_with_groq(full_text)

        if not cheque_number:
            cheque_number = ai_data.get("cheque_number")

        if not amount:
            amount = ai_data.get("amount")

        if not payee:
            payee = ai_data.get("payee")

        if not date:
            date = ai_data.get("date")

        issue_date = None

        if date:
            try:
                issue_date = datetime.strptime(date,"%d/%m/%Y").date()
            except:
                issue_date = None

        description = None

        if purpose:
            description = f"Pay to {payee} for {purpose} via {bank}"

        cheque.objects.create(
            cheque_no = cheque_number,
            payee = payee,
            amount = amount,
            issue_date = issue_date,
            description = description,
            Image = image_file
        )

        return Response({

            "status":"success",

            "data":{
                "cheque_number":cheque_number,
                "payee":payee,
                "amount":amount,
                "date":date,
                "bank":bank
            },

            "raw_text":full_text
        })

    except Exception as e:

        return Response({
            "error":f"Internal Server Error: {str(e)}"
        })