from django.urls import path
from .views import (
    # Shop Owner Views
    PlaceShopOrderView, ShopOwnerOrdersView, ShopOwnerOrderDetailView,
    ShopOwnerProductsView, CancelShopOrderView, ShopOwnerConfirmDeliveryView,ToggleShopProductActiveView,
    ShopOrderStatusView, ShopOwnerActiveProductsView,ShopOwnerProductPurchaseHistoryView, 
    
    # Manager Views  
    ManagerPendingRequestsView, ManagerRequestDetailView,
    ManagerAcceptRequestView, ManagerRejectRequestView,
    ManagerRequestHistoryView, UpdateShopOwnerProductPriceView, ManagerFulfilledOrdersListView,
    ManagerOrderDetailView, ManagerUpdateOrderStatusView, UpdateShopOrderPaymentView,
    ShopOrderStatementView,
)
from .invoice_views import (
    ManagerOrderInvoicePDFView, ManagerOrderInvoicePDFDownloadView,
    ShopOwnerOrderItemInvoicePDFDownloadView, ShopOwnerOrderItemInvoicePDFView,
    ManagerOrderDeliveryChallanPDFDownloadView,
    ShopPaymentReceiptView, ShopPaymentReceiptDownloadView,
)

urlpatterns = [
    # Inventory Management
    path('orders/place/', PlaceShopOrderView.as_view(), name='place-shop-order'),
    path('orders/', ShopOwnerOrdersView.as_view(), name='shop-owner-orders'),
    path('orders/<int:order_id>/', ShopOwnerOrderDetailView.as_view(), name='shop-order-detail'),
    path('orders/<int:order_id>/status/', ShopOrderStatusView.as_view(), name='shop-order-status'),
    path('orders/<int:order_id>/cancel/', CancelShopOrderView.as_view(), name='cancel-shop-order'),
    path('shopowner-product/<int:product_id>/update-price/', UpdateShopOwnerProductPriceView.as_view(), name='update-product-price'),
    path('shopowner-products/', ShopOwnerProductsView.as_view(), name='shop-owner-products'),
    path('active/shopowner-products/', ShopOwnerActiveProductsView.as_view(), name='active-shop-owner-products'),
    path('orders/<int:order_id>/confirm-delivery/', ShopOwnerConfirmDeliveryView.as_view(), name='confirm_delivery'),
    path('products/<int:product_id>/toggle-active/', ToggleShopProductActiveView.as_view(), name='toggle_product_active'),
    path('products/<int:product_id>/purchase-history/', ShopOwnerProductPurchaseHistoryView.as_view(), name='product_purchase_history'),
    path('orders/<int:order_id>/items/<int:item_id>/invoice/view/', ShopOwnerOrderItemInvoicePDFView.as_view(), name='shopowner-item-invoice-view'),
    path('orders/<int:order_id>/items/<int:item_id>/invoice/pdf/', ShopOwnerOrderItemInvoicePDFDownloadView.as_view(), name='shopowner-item-invoice-download'),
    #Request Handling
    path('manager/requests/pending/', ManagerPendingRequestsView.as_view(), name='manager-pending-requests'),
    path('manager/requests/<int:request_id>/', ManagerRequestDetailView.as_view(), name='manager-request-detail'),
    path('manager/requests/<int:request_id>/accept/', ManagerAcceptRequestView.as_view(), name='accept-shop-request'),
    path('manager/requests/<int:request_id>/reject/', ManagerRejectRequestView.as_view(), name='reject-shop-request'),
    path('manager/requests/history/', ManagerRequestHistoryView.as_view(), name='manager-request-history'),
    #manager order management
    path('manager/fulfilled-orders/', ManagerFulfilledOrdersListView.as_view(), name='manager-fulfilled-orders'),
    path('manager/orders/<int:order_id>/', ManagerOrderDetailView.as_view(), name='manager-order-detail'),
    path('manager/orders/<int:order_id>/invoice/view/', ManagerOrderInvoicePDFView.as_view(), name='manager-invoice-view'),
    path('manager/orders/<int:order_id>/invoice/pdf/', ManagerOrderInvoicePDFDownloadView.as_view(), name='manager-invoice-download'),
    path('manager/orders/<int:order_id>/delivery-challan/pdf/', ManagerOrderDeliveryChallanPDFDownloadView.as_view(), name='manager-delivery-challan-download'),
    path('manager/orders/<int:order_id>/update-status/', ManagerUpdateOrderStatusView.as_view(), name='manager-update-order-status'),
    path('manager/orders/<int:order_id>/update-payment/', UpdateShopOrderPaymentView.as_view(), name='manager-update-order-payment'),
    path('manager/orders/<int:order_id>/receipt/<int:transaction_id>/view/', ShopPaymentReceiptView.as_view(), name='shop-payment-receipt-view'),
    path('manager/orders/<int:order_id>/receipt/<int:transaction_id>/pdf/', ShopPaymentReceiptDownloadView.as_view(), name='shop-payment-receipt-download'),
    path('manager/orders/<int:order_id>/statement/', ShopOrderStatementView.as_view(), name='shop-order-statement'),
]
