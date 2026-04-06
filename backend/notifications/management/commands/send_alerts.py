from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives, send_mail
import logging
import os
from datetime import date
from cheque.models import Alerts, cheque
from account.models import Account # Assuming your 'is_cheque_requested' is here

User = get_user_model()

# ✅ Fix for Render: Use a writable directory or stream to console
LOG_FILE = "/tmp/task_log.txt" if not os.name == 'nt' else "task_log.txt"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class Command(BaseCommand):
    help = 'Send daily cheque alerts and request new cheque books'

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        today = date.today()
        logging.info("DAILY ALERT TASK STARTED")

        for user in users:
            if not user.email:
                continue

            # 1. Fetch Pending Alerts
            alerts_qs = Alerts.objects.filter(
                user=user,
                cheque__status__iexact='PENDING'
            )

            if alerts_qs.exists():
                self.send_summary_email(user, alerts_qs, today)

            # 2. ✅ BANK REQUEST LOGIC
            self.check_cheque_book_threshold(user)

    def send_summary_email(self, user, alerts_qs, today):
        pending_rows = ""
        alert_rows = ""
        seen_cheques = set()
        seen_alerts = set()

        for alert in alerts_qs:
            ch = alert.cheque
            payee = alert.payee
            cheque_date = alert.cheque_date

            # Unique Pending Rows
            if ch.cheque_no not in seen_cheques:
                pending_rows += f"<tr><td>{ch.cheque_no}</td><td>{payee}</td><td>₹{ch.amount}</td></tr>"
                seen_cheques.add(ch.cheque_no)

            # Unique Alert Text
            alert_text = ""
            if cheque_date == today:
                alert_text = f"🚨 Bounce Alert: {payee}" if "balance" in alert.alerts.lower() else f"📌 Due Today: {payee}"
            elif cheque_date > today:
                days = (cheque_date - today).days
                alert_text = f"📅 {payee} – due in {days} days"

            if alert_text and alert_text not in seen_alerts:
                color = "red" if "Bounce" in alert_text else "orange" if "Today" in alert_text else "black"
                alert_rows += f"<li style='color:{color};'>{alert_text}</li>"
                seen_alerts.add(alert_text)

        html_content = f"""
        <html>
            <body style="font-family: Arial;">
                <h2 style="color:#2c3e50;">📋 Pending Cheques</h2>
                <table border="1" cellpadding="8" style="border-collapse: collapse;">
                    <tr style="background-color:#f2f2f2;"><th>No</th><th>Payee</th><th>Amount</th></tr>
                    {pending_rows}
                </table>
                <h2 style="color:#c0392b;">⚠️ Alerts</h2>
                <ul>{alert_rows}</ul>
            </body>
        </html>
        """
        email = EmailMultiAlternatives(
            subject="Daily Cheque Summary",
            body="Please view in HTML",
            from_email=os.getenv("EMAIL_USER"),
            to=[user.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        self.stdout.write(self.style.SUCCESS(f"Email sent to {user.email}"))

    def check_cheque_book_threshold(self, user):
        """Logic to alert the bank for a new cheque book"""
        THRESHOLD = 5
        BANK_EMAIL = "bank@example.com" # Change to real bank email
        TOTAL_PER_BOOK = 25

        try:
            # We fetch the account profile for this user
            user_account = Account.objects.get(user=user)
            
            # Count how many cheques this user has issued (created in DB)
            used_count = cheque.objects.filter(user=user).count()
            remaining = TOTAL_PER_BOOK - (used_count % TOTAL_PER_BOOK)

            # ✅ If remaining is low and we haven't requested yet for THIS book
            if remaining <= THRESHOLD and not user_account.is_cheque_requested:
                send_mail(
                    subject="Request for New Cheque Book",
                    message=f"Dear Bank,\n\nAccount Holder: {user.username}\nRemaining Cheques: {remaining}\n\nKindly issue a new cheque book.",
                    from_email=os.getenv("EMAIL_USER"),
                    recipient_list=[BANK_EMAIL],
                    fail_silently=False,
                )
                user_account.is_cheque_requested = True
                user_account.save()
                logging.info(f"BANK ALERT: Cheque book requested for {user.username}")

            # ✅ If user just started a new book (used_count is a multiple of 15), reset status
            elif used_count % TOTAL_PER_BOOK == 0 and user_account.is_cheque_requested:
                user_account.is_cheque_requested = False
                user_account.save()

        except Account.DoesNotExist:
            logging.error(f"Account profile missing for {user.username}")