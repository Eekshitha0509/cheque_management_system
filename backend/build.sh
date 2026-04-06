#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Collect static files for the Django Admin interface
python manage.py collectstatic --no-input

# Run migrations to your Supabase database
python manage.py migrate