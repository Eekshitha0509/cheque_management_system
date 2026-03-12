from django.urls import path
from .views import cheque_reader, list_of,list_alerts

urlpatterns = [
    path("cheque_reader/", cheque_reader),
    path("list/<str:username>/",list_of),
    path("alerts/<str:username>/", list_alerts)
]