from django.urls import path
from .views import UserSalesReportView, AdminSalesReportView

urlpatterns = [
    path('reports/sales/', UserSalesReportView.as_view()),
    path('reports/admin/sales/', AdminSalesReportView.as_view()),
]
