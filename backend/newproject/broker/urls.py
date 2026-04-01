from django.urls import path
from .views import (
    AddBrokerView, UserBrokersView, BrokerDetailView, 
    UpdateBrokerView, DeleteBrokerView,UserActiveBrokersView,AdminBrokerView
)

urlpatterns = [
    path('admin/brokers/', AdminBrokerView.as_view(), name='admin_brokers'),
    path('add-broker/', AddBrokerView.as_view(), name='add_broker'),
    path('user-brokers/', UserBrokersView.as_view(), name='user_brokers'),
    path('active/user-brokers/', UserActiveBrokersView.as_view(), name='active_user_brokers'),
    path('broker/<int:pk>/', BrokerDetailView.as_view(), name='broker_detail'),
    path('update-broker/<int:pk>/', UpdateBrokerView.as_view(), name='update_broker'),
    path('delete-broker/<int:pk>/', DeleteBrokerView.as_view(), name='delete_broker'),
]
