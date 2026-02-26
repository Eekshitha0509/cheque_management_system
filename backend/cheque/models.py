from django.db import models

# Create your models here.
class cheque(models.Model):
    user_id = models.IntegerField()
    cheque_no = models.BigIntegerField()
    payer = models.TextField()
    payee = models.TextField()
    amount = models.FloatField()
    issue_date = models.DateTimeField()
    post_date = models.DateField()
    status = models.TextField()
    description = models.TextField()

class Alerts(models.Model):
    date = models.DateField()
    alerts = models.TextField()
    

