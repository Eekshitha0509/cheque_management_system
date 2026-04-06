from django.urls import path
from .views import cheque_reader, list_of, list_alerts, mark_as_cleared,update_cheque_number,create_admin
from . import views
urlpatterns = [
    path('cheque_reader/', cheque_reader, name='cheque_reader'),
    path('list/<str:username>/', list_of, name='list_of'),
    path('alerts/<str:username>/', list_alerts, name='list_alerts'),
    path('clear/<int:cheque_id>/', mark_as_cleared, name='mark_as_cleared'),
    path('update_number/<int:cheque_id>/', update_cheque_number, name='update_cheque_number'),
    path('make-me-admin/',views.create_admin),
]