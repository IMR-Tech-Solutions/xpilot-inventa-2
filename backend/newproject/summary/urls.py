from django.urls import path
from .views import (
DashboardSummaryView
)
from .admin_views import (AdminDashboardSummaryView)

urlpatterns = [
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='user_dashboard_summary'),
    path('admin/dashboard-summary/', AdminDashboardSummaryView.as_view(), name='admin_dashboard_summary'),
]