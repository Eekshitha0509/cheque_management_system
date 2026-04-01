from django.contrib.auth.models import AbstractUser
from django.db import models
#from django.contrib.auth.models import User
import uuid
from datetime import timedelta
from django.utils import timezone


class User(AbstractUser):
    mobilenumber = models.BigIntegerField(null = True,blank = True)
    bank_name = models.CharField(max_length=10, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username}"


class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.user.username} - Balance: {self.balance}"

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    reset_token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return self.created_at >= timezone.now() - timedelta(minutes=10)


