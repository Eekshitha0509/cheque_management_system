import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cms.settings')


def pytest_configure():
    from django.conf import settings
    if not settings.configured:
        settings.configure(
            DEBUG=True,
            DATABASES={
                'default': {
                    'ENGINE': 'django.db.backends.sqlite3',
                    'NAME': ':memory:',
                }
            },
            INSTALLED_APPS=[
                'django.contrib.admin',
                'django.contrib.auth',
                'django.contrib.contenttypes',
                'django.contrib.sessions',
                'django.contrib.messages',
                'django.contrib.staticfiles',
                'account',
                'api',
                'rest_framework',
                'corsheaders',
                'cheque',
                'notifications',
            ],
            ROOT_URLCONF='cms.urls',
            SECRET_KEY='test-secret-key',
            USE_TZ=True,
        )
    django.setup()
