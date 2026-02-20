from django.urls import path,include
from . import views

urlpatterns = [
    path('cheque/',views.cheque_details),
    path('cheque/<int:pk>/',views.cheque_id_view),

    path('user/',views.User_View.as_view()),
    path('user/<int:pk>/',views.User_id_view.as_view()),

]