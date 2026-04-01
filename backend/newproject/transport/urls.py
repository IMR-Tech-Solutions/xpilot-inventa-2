from django.urls import path
from .views import (
    AddTransporterView,
    AllTransportersView,
    AllUserTransportersView,
    UserTransportersView,
    UpdateTransporterView,
    TransporterDetailView,
    DeleteTransporterView,
    UserActiveTransportersView
)

urlpatterns = [
    # Admin
    path("admin/all-transporters/", AllTransportersView.as_view(), name="admin-all-transporters"),
    path("admin/user-transporters/<int:user_id>/", AllUserTransportersView.as_view(), name="admin-user-transporters"),

    # User
    path("add-transporter/", AddTransporterView.as_view(), name="add-transporter"),
    path("my-transporters/", UserTransportersView.as_view(), name="my-transporters"),
    path("active/my-transporters/", UserActiveTransportersView.as_view(), name="my-transporters"),
    path("update-transporter/<int:pk>/", UpdateTransporterView.as_view(), name="update-transporter"),
    path("transporter/<int:pk>/", TransporterDetailView.as_view(), name="transporter-detail"),
    path("delete-transporter/<int:pk>/", DeleteTransporterView.as_view(), name="delete-transporter"),
]
