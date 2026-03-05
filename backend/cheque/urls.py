from django.urls import path
from .views import upload_cheque

urlpatterns = [
    path("upload-cheque/", upload_cheque),
]