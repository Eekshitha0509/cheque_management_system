import pytest
from django.contrib.auth import get_user_model
from account.models import Account, PasswordResetOTP
from datetime import timedelta
from django.utils import timezone

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert not user.is_verified

    def test_create_superuser(self):
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        assert superuser.is_superuser
        assert superuser.is_staff

    def test_user_str(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        assert str(user) == 'testuser'


@pytest.mark.django_db
class TestAccountModel:
    def test_create_account(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        account = Account.objects.create(
            user=user,
            balance=10000.00
        )
        assert account.user.username == 'testuser'
        assert account.balance == 10000.00
        assert not account.is_cheque_requested

    def test_account_str(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        account = Account.objects.create(
            user=user,
            balance=5000.00
        )
        assert 'testuser' in str(account)


@pytest.mark.django_db
class TestPasswordResetOTP:
    def test_create_otp(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        otp = PasswordResetOTP.objects.create(
            user=user,
            otp='123456'
        )
        assert otp.otp == '123456'
        assert otp.reset_token is not None

    def test_otp_is_valid(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        otp = PasswordResetOTP.objects.create(
            user=user,
            otp='123456'
        )
        assert otp.is_valid()

    def test_otp_is_invalid_after_timeout(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        otp = PasswordResetOTP.objects.create(
            user=user,
            otp='123456'
        )
        otp.created_at = timezone.now() - timedelta(minutes=15)
        otp.save()
        assert not otp.is_valid()
