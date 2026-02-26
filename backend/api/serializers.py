from rest_framework import serializers
from datetime import date, timedelta 
from cheque.models import cheque
from django.utils import timezone
from account.models import User

# ==========================================
# CHEQUE SERIALIZER
# ==========================================
class chequeSerializer(serializers.ModelSerializer):
    class Meta:
        model = cheque 
        fields = "__all__"

    def validate_cheque_id(self, value):
        # Ensure cheque_id is exactly 6 digits
        str_val = str(value).strip()
        if not str_val.isdigit():
            raise serializers.ValidationError('The cheque_id must contain only digits.')
        if len(str_val) != 6:
            raise serializers.ValidationError('The cheque_id must be exactly 6 digits.')
        return str_val

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be positive.')
        return value
    
    def validate_post_date(self, value):
        if value:
            today = timezone.now().date() 
            if value > today + timedelta(days=730):
                raise serializers.ValidationError('Date cannot be greater than 2 years.')
        return value
    
    def validate_issue_date(self, value):
        if value:
            check_date = value.date() if hasattr(value, 'date') else value
            today = timezone.now().date()
            if check_date < today - timedelta(days=90):
                raise serializers.ValidationError('It is a stale cheque.')
        return value

    def validate(self, data):
        """
        Object-level validation for Cheque
        """
        # Comparison: Old DB value vs New Request value
        if self.instance: 
            new_status = data.get('status')
            old_status = self.instance.status

            if old_status == 'Cleared' and new_status == 'Pending':
                raise serializers.ValidationError({
                    "status": "A cleared cheque cannot be moved back to pending."
                })
        
        return data


# ==========================================
# USER SERIALIZER
# ==========================================
class UserSerializer(serializers.ModelSerializer):
    # Password should be write-only for security
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'mobilenumber', 'bank_name']

    # --- Field-Level Validations ---

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        return value

    def validate_bank_name(self, value):
        allowed_banks = ['SBI', 'HDFC', 'ICICI', 'AXIS']
        # Converting to uppercase to ensure case-insensitive matching if needed
        if value and value.upper() not in allowed_banks:
            raise serializers.ValidationError(f"Bank name must be one of: {', '.join(allowed_banks)}")
        return value

    # --- Object-Level Validations ---

    def validate(self, data):
        # Example logic: Ensure staff members have an email
        if data.get('is_staff') and not data.get('email'):
            raise serializers.ValidationError({"email": "Staff members must have a registered email address."})
        return data

    # --- Overriding Create ---

    def create(self, validated_data):
        """
        Overrides the default create method to use create_user.
        This ensures the password is saved as a secure hash, not plain text.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            mobilenumber=validated_data.get('mobile_number'),
            bank_name=validated_data.get('bank_name')
        )
        return user