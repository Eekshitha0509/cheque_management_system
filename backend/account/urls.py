from django.urls import path
from . import views

urlpatterns = [
    # ... other urls ...
    path('profile/<str:username>/', views.get_details, name='get_details'),
    path('update-balance/<str:username>/', views.update_balance, name='update_balance'),
    path('request-otp/', views.RequestOTP.as_view(), name='request_otp'),
    path('verify-otp/', views.VerifyOTP.as_view(), name='verify_otp'),
    path('reset-password/', views.ResetPassword.as_view(), name='reset_password'),
]
