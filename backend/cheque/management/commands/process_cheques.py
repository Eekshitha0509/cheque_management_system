from django.core.management.base import BaseCommand
from datetime import date, timedelta
from cheque.models import cheque, Alerts

class Command(BaseCommand):
    help = "Cheque alert system"

    def handle(self, *args, **kwargs):
        today = date.today()
        warning_limit = today + timedelta(days=3)

        cheques = cheque.objects.filter(post_date__isnull=False)

        for ch in cheques:
            user = ch.user

            # ✅ If cleared → delete alert
            if ch.status == "CLEARED":
                Alerts.objects.filter(cheque=ch).delete()
                continue

            # 🔸 BEFORE DATE → WARNING
            if today < ch.post_date <= warning_limit:
                Alerts.objects.update_or_create(
                    cheque=ch,
                    defaults={
                        "user": user,
                        "payee": ch.payee,
                        "cheque_date": ch.post_date,
                        "alerts": f"⚠️ Cheque may bounce on {ch.post_date}"
                    }
                )

            # 🔸 ON DATE → CRITICAL
            elif ch.post_date == today:
                Alerts.objects.update_or_create(
                    cheque=ch,
                    defaults={
                        "user": user,
                        "payee": ch.payee,
                        "cheque_date": ch.post_date,
                        "alerts": f"🚨 Cheque due today ({ch.post_date})"
                    }
                )

            # 🔸 AFTER DATE → DELETE ALERT
            elif ch.post_date < today:
                Alerts.objects.filter(cheque=ch).delete()

        self.stdout.write(self.style.SUCCESS("Alert system executed successfully"))