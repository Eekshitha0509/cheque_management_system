from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    mobilenumber = models.BigIntegerField(max_length=10,null = True,blank = True)
    bank_name = models.CharField(max_length=10, blank=True, null=True)
    is_verified = models.BooleanField(default=False)


    # Do NOT add groups or user_permissions here; 
    # AbstractUser handles them automatically.