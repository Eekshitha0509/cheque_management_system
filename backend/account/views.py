from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import User, Account
import random
from rest_framework import status
from django.core.mail import send_mail
from .models import PasswordResetOTP , User
from rest_framework.response import Response
from rest_framework.views import APIView

@api_view(['GET'])
def get_details(request, username):
    """Fetches user details and balance from the Account table."""
    try:
        user = User.objects.get(username=username)
        # Using the user_id relationship from your screenshot
        acc, created = Account.objects.get_or_create(user=user, defaults={'balance': 0.00})
        
        return JsonResponse({
            "status": "success",
            "data": {
                "username": user.username,
                "bank_name": user.bank_name or "Not Linked",
                "mobile": user.mobilenumber,
                "is_verified": user.is_verified,
                "balance": float(acc.balance) # Pulls from the balance column in your image
            }
        })
    except User.DoesNotExist:
        return JsonResponse({"status": "error", "message": "User not found"}, status=404)

@api_view(['POST'])
def update_balance(request, username):
    """Updates the balance column in the Account table."""
    try:
        user = User.objects.get(username=username)
        acc = Account.objects.get(user=user)
        
        new_balance = request.data.get('balance')
        if new_balance is not None:
            acc.balance = new_balance
            acc.save()

        return JsonResponse({"status": "success", "message": "Balance updated successfully!"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


class RequestOTP(APIView):
    def post(self, request):
        email = request.data.get('email')

        try:
            user = User.objects.get(email=email)

            # remove old OTPs (important)
            PasswordResetOTP.objects.filter(user=user).delete()

            otp = str(random.randint(100000, 999999))
            PasswordResetOTP.objects.create(user=user, otp=otp)

            send_mail(
                'Your Password Reset OTP',
                f'Your code is {otp}',
                'qcheque5@gmail.com',
                [email],
            )

            return Response({"message": "OTP Sent"}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class VerifyOTP(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        record = PasswordResetOTP.objects.filter(
            user__email=email,
            otp=otp
        ).last()

        if record and record.is_valid():
            return Response({
                "reset_token": str(record.reset_token) 
            }, status=status.HTTP_200_OK)

        return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
    

class ResetPassword(APIView):
    def post(self, request):
        token = request.data.get('reset_token')
        new_password = request.data.get('new_password')

        record = PasswordResetOTP.objects.filter(
            reset_token=token
        ).last()

        if record and record.is_valid():
            user = record.user
            user.set_password(new_password)
            user.save()

            record.delete() 

            return Response({"message": "Password updated successfully"})

        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)