from django.db import models
from django.contrib.auth import get_user_model
from datetime import date

User = get_user_model()


class cheque(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    cheque_no = models.CharField(max_length=20)
    payee = models.TextField()
    amount = models.FloatField()
    issue_date = models.DateField(null=True, blank=True)
    post_date = models.DateField(null=True, blank=True)
    description = models.TextField()
    Image = models.ImageField(upload_to='cheques/', blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('CLEARED', 'Cleared')
        ],
        default='PENDING'
    )

    # ✅ CORRECT META
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'cheque_no'],
                name='unique_user_cheque'
            )
        ]


class Alerts(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    cheque = models.ForeignKey(cheque, on_delete=models.CASCADE)

    date = models.DateField(default=date.today)
    payee = models.CharField(max_length=255)
    cheque_date = models.DateField()
    alert_type = models.CharField(max_length=20, default="GENERAL")
    alerts = models.TextField()

    def __str__(self):
        return self.alerts