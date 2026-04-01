from django.urls import path
from .views import AllUsersWithRolesView, UserDetailView

urlpatterns = [
    path('management/users/', AllUsersWithRolesView.as_view(), name='management-all-users'),
    path('management/users/<int:user_id>/', UserDetailView.as_view(), name='management-user-detail'),
]
