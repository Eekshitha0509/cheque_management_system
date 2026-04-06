import os
from dotenv import load_dotenv

# ✅ 1. load env
load_dotenv()

# ✅ 2. set settings module BEFORE django import
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cms.settings")

# ✅ 3. now import django
import django
django.setup()

# ✅ 4. NOW import other things
import cloudinary
import cloudinary.uploader
from django.conf import settings
from cheque.models import cheque

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)


for obj in cheque.objects.all():
    print("Checking:", obj.Image)

    if obj.Image:
        # build correct local path
        local_path = os.path.join(settings.MEDIA_ROOT, str(obj.Image))

        print("Local path:", local_path)

        if os.path.exists(local_path):
            print(f"Uploading {local_path}")

            result = cloudinary.uploader.upload(local_path)

            obj.Image = result['secure_url']   # ✅ update field
            obj.save()

            print("Updated to:", obj.Image)

        else:
            print("❌ File not found:", local_path)

print("Migration complete ✅")