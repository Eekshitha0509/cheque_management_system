from django.urls import path
from . import views

urlpatterns = [
    path('cheque/',views.all_cheque,name = 'cheque')
]