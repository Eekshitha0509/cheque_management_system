from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import User, Account

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