from django.urls import path
from .views import (
    AddCustomerView,
    AllCustomersView,
    AllUserCustomersView,
    UserCustomersView,
    UpdateCustomerView,
    CustomerDetailView,
    DeleteCustomerView,
)

urlpatterns = [
    # Admin urls
    path("admin/all-customers/", AllCustomersView.as_view(), name="admin-all-customers"),
    path("admin/user-customers/<int:user_id>/", AllUserCustomersView.as_view(), name="admin-customers-view-based-on-user"),
    
    # Common urls
    path("add-customer/", AddCustomerView.as_view(), name="add-customer"),
    
    # User urls
    path("my-customers/", UserCustomersView.as_view(), name="customers-view-based-on-user"),
    path("update-customer/<int:pk>/", UpdateCustomerView.as_view(), name="update-customer"),
    path("customer/<int:pk>/", CustomerDetailView.as_view(), name="customer-detail"),
    path("delete-customer/<int:pk>/", DeleteCustomerView.as_view(), name="delete-customer"),
]
