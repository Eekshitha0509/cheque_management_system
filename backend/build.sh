#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Collect static files for the Django Admin interface
python manage.py collectstatic --no-input

# Run migrations to your Supabase database
python manage.py migrate

# Auto-create superuser if it doesn't exist
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
username = 'eekshitha'
email = 'eekshithanamala3@gmail.com'
password = 'Eeshu@123'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created successfully.")
else:
    print(f"Superuser '{username}' already exists.")
EOF