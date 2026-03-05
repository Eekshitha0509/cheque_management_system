from django.db import models


class cheque(models.Model):

    user_id = models.CharField(max_length=100)
    cheque_no = models.CharField(max_length=20)
    payee = models.TextField()
    amount = models.FloatField()
    issue_date = models.DateField(null=True, blank=True)
    post_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, default="Pending")
    description = models.TextField(null=True, blank=True)
    Image = models.ImageField(upload_to="cheques/", null=True, blank=True)

class Alerts(models.Model):

    date = models.DateField()
    alerts = models.TextField()