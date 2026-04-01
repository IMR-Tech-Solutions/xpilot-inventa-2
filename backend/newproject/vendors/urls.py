from django.urls import path
from .views import (
    AddVendorView,
    AllVendorsView,
    AllUserVendorsView,
    UserVendorsView,
    UpdateVendorView,
    VendorDetailView,
    DeleteVendorView,
    UserActiveVendorsView,
    VendorInvoiceBrokerCommissionView
)
from .invoice_views import VendorInvoiceListView, VendorInvoicePDFView, VendorInvoicePDFDownloadView

urlpatterns = [
    # Admin URLs
    path("admin/all-vendors/", AllVendorsView.as_view(), name="admin-all-vendors"),
    path("admin/user-vendors/<int:user_id>/", AllUserVendorsView.as_view(), name="admin-vendors-view-based-on-user"),
    # Common URLs
    path("add-vendor/", AddVendorView.as_view(), name="add-vendor"),
    # User URLs
    path("my-vendors/", UserVendorsView.as_view(), name="vendors-view-based-on-user"),
    path('active/my-vendors/', UserActiveVendorsView.as_view(), name='particular-user-vendors-active'),
    path("update-vendor/<int:pk>/", UpdateVendorView.as_view(), name="update-vendor"),
    path("vendor/<int:pk>/", VendorDetailView.as_view(), name="vendor-detail"),
    path("delete-vendor/<int:pk>/", DeleteVendorView.as_view(), name="delete-vendor"),
    path('vendor-invoices/', VendorInvoiceListView.as_view(), name='vendor-invoice-list'),
    path('vendor-invoices/<int:invoice_id>/view/', VendorInvoicePDFView.as_view(), name='vendor-invoice-view'),
    path('vendor-invoices/<int:invoice_id>/pdf/', VendorInvoicePDFDownloadView.as_view(), name='vendor-invoice-download'),
    path('invoices/<int:invoice_id>/broker-commissions/', VendorInvoiceBrokerCommissionView.as_view(), name='vendor_invoice_broker_commissions'),
]
