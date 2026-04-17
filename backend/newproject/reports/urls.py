from django.urls import path
from .views import (
    UserSalesReportView, AdminSalesReportView,
    UserPurchaseReportView, AdminPurchaseReportView,
    UserBrokerReportView, AdminBrokerReportView,
    UserTransporterReportView, AdminTransporterReportView,
    UserFranchiseReportView, AdminFranchiseReportView,
    ShopOwnerPurchaseReportView,
)

urlpatterns = [
    path('reports/sales/', UserSalesReportView.as_view()),
    path('reports/admin/sales/', AdminSalesReportView.as_view()),
    path('reports/purchase/', UserPurchaseReportView.as_view()),
    path('reports/admin/purchase/', AdminPurchaseReportView.as_view()),
    path('reports/broker/', UserBrokerReportView.as_view()),
    path('reports/admin/broker/', AdminBrokerReportView.as_view()),
    path('reports/transporter/', UserTransporterReportView.as_view()),
    path('reports/admin/transporter/', AdminTransporterReportView.as_view()),
    path('reports/franchise/', UserFranchiseReportView.as_view()),
    path('reports/admin/franchise/', AdminFranchiseReportView.as_view()),
    path('reports/shop-owner/purchase/', ShopOwnerPurchaseReportView.as_view()),
]
