from django.urls import path
from .views import (
    AllUsersWithRolesView,
    UserDetailView,
    AllStockManagementView,
    ProductStockDetailView,
)

urlpatterns = [
    path('management/users/', AllUsersWithRolesView.as_view(), name='management-all-users'),
    path('management/users/<int:user_id>/', UserDetailView.as_view(), name='management-user-detail'),
    path('management/stock/', AllStockManagementView.as_view(), name='management-all-stock'),
    path('management/stock/<int:product_id>/', ProductStockDetailView.as_view(), name='management-product-stock-detail'),
]
