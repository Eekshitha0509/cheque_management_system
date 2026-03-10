from django.urls import path
from .views import cheque_reader, list_of

urlpatterns = [
    path("cheque_reader/", cheque_reader),
    path("list/<str:username>/",list_of),
]