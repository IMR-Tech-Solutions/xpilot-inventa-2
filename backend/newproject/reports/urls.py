from django.urls import path
from .views import (
    UserSalesReportView, AdminSalesReportView,
    UserPurchaseReportView, AdminPurchaseReportView,
    UserBrokerReportView, AdminBrokerReportView,
    UserFranchiseReportView, AdminFranchiseReportView,
)

urlpatterns = [
    path('reports/sales/', UserSalesReportView.as_view()),
    path('reports/admin/sales/', AdminSalesReportView.as_view()),
    path('reports/purchase/', UserPurchaseReportView.as_view()),
    path('reports/admin/purchase/', AdminPurchaseReportView.as_view()),
    path('reports/broker/', UserBrokerReportView.as_view()),
    path('reports/admin/broker/', AdminBrokerReportView.as_view()),
    path('reports/franchise/', UserFranchiseReportView.as_view()),
    path('reports/admin/franchise/', AdminFranchiseReportView.as_view()),
]
