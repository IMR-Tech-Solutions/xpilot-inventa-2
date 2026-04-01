from django.urls import path
from .views import (
    AddPOSOrderView, AllPOSOrdersView, AllUserPOSOrdersView, UserPOSOrdersView,
    UpdatePOSOrderView, POSOrderDetailView, CancelPOSOrderView,AddShopPOSOrderView
)
from .invoice_views import POSOrderInvoicePDFView, POSOrderInvoicePDFDownloadView

urlpatterns = [
    # Common urls
    path("add-pos-order/", AddPOSOrderView.as_view(), name="add-pos-order"),
    path("add-shoppos-order/", AddShopPOSOrderView.as_view(), name="add-pos-order"),
    
    # Admin urls
    path('admin/all-pos-orders/', AllPOSOrdersView.as_view(), name='admin-all-pos-orders'),
    path('admin/user-pos-orders/<int:user_id>/', AllUserPOSOrdersView.as_view(), name='admin-per-user-pos-orders'),
    
    # For users
    path('my-pos-orders/', UserPOSOrdersView.as_view(), name='particular-user-pos-orders'),
    path("update-pos-order/<int:pk>/", UpdatePOSOrderView.as_view(), name="update-pos-order"),
    path("pos-order/<int:pk>/", POSOrderDetailView.as_view(), name="pos-order-detail"),
    path("cancel-pos-order/<int:pk>/", CancelPOSOrderView.as_view(), name="cancel-pos-order"),
    path('pos-orders/<int:order_id>/invoice/view/', POSOrderInvoicePDFView.as_view(), name='pos-order-invoice-view'),
    path('pos-orders/<int:order_id>/invoice/pdf/', POSOrderInvoicePDFDownloadView.as_view(), name='pos-order-invoice-download'),
]
