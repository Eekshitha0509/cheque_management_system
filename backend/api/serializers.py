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
    class Meta:
        model = User
        fields = '__all__'

    # --- FIELD LEVEL (Specific Columns) ---

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        return value

    def validate_bank_name(self, value):
        # Added null-safety check to prevent 'NoneType' has no attribute 'upper' error
        if not value:
            return value
            
        valid_banks = ['SBI', 'HDFC', 'ICICI', 'AXIS']
        clean_value = value.strip().upper()
        
        if clean_value not in valid_banks:
            raise serializers.ValidationError("Only authorized banks (SBI, HDFC, ICICI, AXIS) are allowed.")
        return clean_value

    # --- OBJECT LEVEL (Cross-Column or State Logic) ---

    def validate(self, data):
        """
        Object-level validation for User
        """
        # 1. Superuser/Staff Logic
        # We use .get() with a fallback to self.instance to handle PATCH requests correctly
        is_superuser = data.get('is_superuser', self.instance.is_superuser if self.instance else False)
        is_staff = data.get('is_staff', self.instance.is_staff if self.instance else False)

        if is_superuser and not is_staff:
            raise serializers.ValidationError({
                "is_staff": "Superusers must also have staff status."
            })

        # 2. Staff Email Requirement (Testing Testcase 4)
        email = data.get('email', self.instance.email if self.instance else "")
        if is_staff and not email:
            raise serializers.ValidationError({
                "email": "Staff members must have a registered email address."
            })

        # 3. Protecting 'date_joined' from being changed during update
        if self.instance and 'date_joined' in data:
            # Convert both to string or date objects to compare accurately
            new_date = data['date_joined']
            if new_date != self.instance.date_joined:
                raise serializers.ValidationError({
                    "date_joined": "The joining date cannot be altered after creation."
                })

        return data