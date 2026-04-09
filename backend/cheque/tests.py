import pytest
from django.contrib.auth import get_user_model
from cheque.models import cheque, Alerts
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.django_db
class TestChequeModel:
    def test_create_cheque(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='123456',
            payee='John Doe',
            amount=5000.00,
            description='Payment for services'
        )
        assert cheque_obj.cheque_no == '123456'
        assert cheque_obj.payee == 'John Doe'
        assert cheque_obj.amount == 5000.00
        assert cheque_obj.status == 'PENDING'

    def test_cheque_default_status(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='654321',
            payee='Jane Doe',
            amount=10000.00,
            description='Payment for goods'
        )
        assert cheque_obj.status == 'PENDING'

    def test_cheque_can_be_cleared(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='111222',
            payee='Test Payee',
            amount=2500.00,
            description='Test payment',
            status='CLEARED'
        )
        assert cheque_obj.status == 'CLEARED'

    def test_cheque_with_dates(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        issue_date = date.today()
        post_date = date.today() + timedelta(days=3)
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='333444',
            payee='dated payee',
            amount=7500.00,
            description='Dated payment',
            issue_date=issue_date,
            post_date=post_date
        )
        assert cheque_obj.issue_date == issue_date
        assert cheque_obj.post_date == post_date


@pytest.mark.django_db
class TestAlertsModel:
    def test_create_alert(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='555666',
            payee='Alert Payee',
            amount=3000.00,
            description='Alert test'
        )
        alert = Alerts.objects.create(
            user=user,
            cheque=cheque_obj,
            payee='Alert Payee',
            cheque_date=date.today(),
            alerts='Test alert message'
        )
        assert alert.payee == 'Alert Payee'
        assert alert.alert_type == 'GENERAL'

    def test_alert_default_type(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='777888',
            payee='Default Type Payee',
            amount=1500.00,
            description='Test'
        )
        alert = Alerts.objects.create(
            user=user,
            cheque=cheque_obj,
            payee='Default Type Payee',
            cheque_date=date.today(),
            alerts='Default type alert'
        )
        assert alert.alert_type == 'GENERAL'

    def test_alert_str(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cheque_obj = cheque.objects.create(
            user=user,
            cheque_no='999000',
            payee='Str Test Payee',
            amount=2000.00,
            description='Str test'
        )
        alert = Alerts.objects.create(
            user=user,
            cheque=cheque_obj,
            payee='Str Test Payee',
            cheque_date=date.today(),
            alerts='This is the alert message'
        )
        assert str(alert) == 'This is the alert message'
