from django.urls import path
from . import views

urlpatterns = [
    # ... other urls ...
    path('profile/<str:username>/', views.get_details, name='get_details'),
    path('update-balance/<str:username>/', views.update_balance, name='update_balance'),
]
