import pytest
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from cheque.models import cheque
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.django_db
class TestChequeSerializer:
    def test_valid_cheque_serializer(self):
        from api.serializers import chequeSerializer
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        data = {
            'user': user.id,
            'cheque_no': '123456',
            'payee': 'Test Payee',
            'amount': 5000.00,
            'description': 'Test payment'
        }
        serializer = chequeSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_invalid_cheque_number_not_digits(self):
        from api.serializers import chequeSerializer
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        data = {
            'user': user.id,
            'cheque_no': 'abc123',
            'payee': 'Test Payee',
            'amount': 5000.00,
            'description': 'Test payment'
        }
        serializer = chequeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'cheque_no' in serializer.errors

    def test_invalid_cheque_number_not_6_digits(self):
        from api.serializers import chequeSerializer
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        data = {
            'user': user.id,
            'cheque_no': '12345',
            'payee': 'Test Payee',
            'amount': 5000.00,
            'description': 'Test payment'
        }
        serializer = chequeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'cheque_no' in serializer.errors

    def test_invalid_cheque_number_none(self):
        from api.serializers import chequeSerializer
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        data = {
            'user': user.id,
            'cheque_no': None,
            'payee': 'Test Payee',
            'amount': 5000.00,
            'description': 'Test payment'
        }
        serializer = chequeSerializer(data=data)
        assert not serializer.is_valid()

    def test_invalid_amount_negative(self):
        from api.serializers import chequeSerializer
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        data = {
            'user': user.id,
            'cheque_no': '123456',
            'payee': 'Test Payee',
            'amount': -100.00,
            'description': 'Test payment'
        }
        serializer = chequeSerializer(data=data)
        assert not serializer.is_valid()
        assert 'amount' in serializer.errors


@pytest.mark.django_db
class TestUserSerializer:
    def test_valid_user_serializer(self):
        from api.serializers import UserSerializer
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'mobilenumber': 1234567890,
            'bank_name': 'SBI'
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_invalid_username_too_short(self):
        from api.serializers import UserSerializer
        data = {
            'username': 'ab',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'mobilenumber': 1234567890,
            'bank_name': 'SBI'
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert 'username' in serializer.errors

    def test_invalid_bank_name(self):
        from api.serializers import UserSerializer
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'mobilenumber': 1234567890,
            'bank_name': 'INVALID'
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert 'bank_name' in serializer.errors

    def test_valid_bank_name_case_insensitive(self):
        from api.serializers import UserSerializer
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'mobilenumber': 1234567890,
            'bank_name': 'sbi'
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
