from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    mobilenumber = models.BigIntegerField(null = True,blank = True)
    bank_name = models.CharField(max_length=10, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}"


class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.user.username} - Balance: {self.balance}"
