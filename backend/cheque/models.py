from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class cheque(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    payee = models.TextField()
    amount = models.FloatField()
    issue_date = models.DateField(null=True, blank=True)
    post_date = models.DateField(null=True, blank=True)
    description = models.TextField()
    Image = models.ImageField(upload_to="cheques/", null=True, blank=True)
    status = models.CharField(max_length=50, default="Pending")

class Alerts(models.Model):

    date = models.DateField()
    alerts = models.TextField()