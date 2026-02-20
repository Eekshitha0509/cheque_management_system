from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    bank_name = models.CharField(max_length=10, blank=True, null=True)

    # Do NOT add groups or user_permissions here; 
    # AbstractUser handles them automatically.