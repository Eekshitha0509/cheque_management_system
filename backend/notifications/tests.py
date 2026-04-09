import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from cheque.models import cheque, Alerts

User = get_user_model()


@pytest.mark.django_db
class TestGetAlertsForUser:
    def test_no_alerts_for_empty_cheque_list(self):
        from notifications.services import get_alerts_for_user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        alerts = get_alerts_for_user(user)
        assert alerts == []

    def test_pending_cheque_alert(self):
        from notifications.services import get_alerts_for_user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        today = date.today()
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='123456',
            payee='Test Payee',
            amount=5000.00,
            description='Test payment',
            status='PENDING',
            post_date=today + timedelta(days=5)
        )
        alerts = get_alerts_for_user(user)
        assert len(alerts) >= 1
        assert '123456' in alerts[0]
        assert 'pending' in alerts[0].lower()

    def test_cleared_cheque_no_pending_alert(self):
        from notifications.services import get_alerts_for_user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='123456',
            payee='Test Payee',
            amount=5000.00,
            description='Test payment',
            status='CLEARED'
        )
        alerts = get_alerts_for_user(user)
        assert alerts == []

    def test_due_soon_alert(self):
        from notifications.services import get_alerts_for_user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        today = date.today()
        due_date = today + timedelta(days=2)
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='654321',
            payee='Due Soon Payee',
            amount=3000.00,
            description='Due soon payment',
            post_date=due_date
        )
        alerts = get_alerts_for_user(user)
        assert len(alerts) >= 1
        assert '654321' in alerts[0]

    def test_due_soon_alert_not_triggered_for_future_date(self):
        from notifications.services import get_alerts_for_user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        future_date = date.today() + timedelta(days=10)
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='999888',
            payee='Future Payee',
            amount=1000.00,
            description='Future payment',
            post_date=future_date
        )
        alerts = get_alerts_for_user(user)
        due_soon_alerts = [a for a in alerts if 'due' in a.lower()]
        assert due_soon_alerts == []
