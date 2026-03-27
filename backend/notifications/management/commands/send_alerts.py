# notifications/management/commands/send_alerts.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from notifications.services import get_alerts_for_user
import logging
from cheque.models import Alerts,cheque

User = get_user_model()

logging.basicConfig(
    filename="C:\\cheque_management_system\\backend\\task_log.txt",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.info("TASK STARTED")

from django.core.mail import EmailMultiAlternatives
from datetime import date

from django.core.mail import EmailMultiAlternatives
from datetime import date

class Command(BaseCommand):

    help = 'Send daily cheque alerts'

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        today = date.today()

        for user in users:
            if not user.email:
                continue

            alerts_qs = Alerts.objects.filter(
                user=user,
                cheque__status__iexact='PENDING'
            )

            if not alerts_qs.exists():
                continue

            pending_rows = ""
            alert_rows = ""

            seen_cheques = set()   # ✅ avoid duplicate cheques
            seen_alerts = set()    # ✅ avoid duplicate alerts

            for alert in alerts_qs:
                ch = alert.cheque
                payee = alert.payee
                cheque_date = alert.cheque_date

                # ---------------------------
                # ✅ UNIQUE PENDING CHEQUES
                # ---------------------------
                if ch.cheque_no not in seen_cheques:
                    pending_rows += f"""
                    <tr>
                        <td>{ch.cheque_no}</td>
                        <td>{payee}</td>
                        <td>₹{ch.amount}</td>
                    </tr>
                    """
                    seen_cheques.add(ch.cheque_no)

                # ---------------------------
                # ✅ UNIQUE ALERTS
                # ---------------------------
                alert_text = ""

                if cheque_date == today:
                    if "balance" in alert.alerts.lower():
                        alert_text = f"🚨 Bounce Alert: {payee} – ₹{ch.amount}"
                    else:
                        alert_text = f"📌 Due Today: {payee} – ₹{ch.amount}"

                elif cheque_date > today:
                    days = (cheque_date - today).days
                    alert_text = f"📅 {payee} – due in {days} days"

                # ✅ Avoid duplicate alerts
                if alert_text and alert_text not in seen_alerts:
                    color = "red" if "Bounce" in alert_text else "orange" if "Today" in alert_text else "black"

                    alert_rows += f"<li style='color:{color};'>{alert_text}</li>"
                    seen_alerts.add(alert_text)

            # ---------------------------
            # ✅ HTML EMAIL
            # ---------------------------
            html_content = f"""
            <html>
            <body style="font-family: Arial;">

                <h2 style="color:#2c3e50;">📋 Pending Cheques</h2>
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                    <tr style="background-color:#f2f2f2;">
                        <th>Cheque No</th>
                        <th>Payee</th>
                        <th>Amount</th>
                    </tr>
                    {pending_rows}
                </table>

                <br>

                <h2 style="color:#c0392b;">⚠️ Alerts</h2>
                <ul>
                    {alert_rows}
                </ul>

                <br>
                <p style="color:gray;">This is an automated message from Cheque Management System</p>

            </body>
            </html>
            """

            email = EmailMultiAlternatives(
                subject="Daily Cheque Summary",
                body="Please view in HTML",
                from_email="qcheque@gmail.com",
                to=[user.email],
            )

            email.attach_alternative(html_content, "text/html")
            email.send()

            self.stdout.write(self.style.SUCCESS(f"Email sent to {user.email}"))


        THRESHOLD = 5
        BANK_EMAIL = "bank@example.com"
        total_cheques = 15
        account = users # adjust if different relation

        used_cheques = cheque.objects.filter(user=user).count()
        remaining = total_cheques - used_cheques

        # ✅ Cheque book request logic
        if remaining <= THRESHOLD and not account.is_cheque_requested:

            send_mail(
                subject="Request for New Cheque Book",
                message=f"""
        Dear Bank,

        Account Holder: {user.username}
        Remaining Cheques: {remaining}

        Kindly issue a new cheque book.

        Thank you.
        """,
                from_email="qcheque@gmail.com",
                recipient_list=[BANK_EMAIL],
                fail_silently=False,
            )

            account.is_cheque_requested = True
            account.save()

            logging.info(f"Cheque book request sent for {user.username}")