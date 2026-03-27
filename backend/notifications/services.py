# notifications/services.py

from datetime import date, timedelta
from cheque.models import cheque, Alerts


def get_alerts_for_user(user):
    today = date.today()
    next_3_days = today + timedelta(days=3)

    cheques = cheque.objects.filter(user=user)

    alerts_list = []

    for ch in cheques:

        # 🟡 1. Pending Alert
        if ch.status == "PENDING":
            msg = f"Cheque {ch.cheque_no} for {ch.payee} is still pending"

            alert_obj, created = Alerts.objects.get_or_create(
                user=user,
                cheque=ch,
                alert_type="PENDING",   # ✅ important
                defaults={
                    "payee": ch.payee,
                    "cheque_date": ch.post_date,
                    "alerts": msg
                }
            )

            alerts_list.append(alert_obj.alerts)

        # 🔴 2. Due Soon Alert (within 3 days)
        if ch.post_date and today <= ch.post_date <= next_3_days:
            msg = f"Cheque {ch.cheque_no} is due on {ch.post_date}"

            alert_obj, created = Alerts.objects.get_or_create(
                user=user,
                cheque=ch,
                alert_type="DUE_SOON",   # ✅ important
                defaults={
                    "payee": ch.payee,
                    "cheque_date": ch.post_date,
                    "alerts": msg
                }
            )

            alerts_list.append(alert_obj.alerts)

    return alerts_list