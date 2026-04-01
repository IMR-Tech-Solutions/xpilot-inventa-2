from django.urls import path
from .views import (
    AddStockEntryView,
    BulkAddStockEntryView,
    StockEntryListView,
    ProductStockEntriesView,
    StockEntryDetailView,
    UpdateStockEntryView,
    AdminAllStockEntriesView,
)

urlpatterns = [
    path('stock/add/', AddStockEntryView.as_view(), name='stock-entry-add'),
    path('stock/bulk-add/', BulkAddStockEntryView.as_view(), name='stock-entry-bulk-add'),
    path('stock/', StockEntryListView.as_view(), name='stock-entry-list'),
    path('stock/<int:entry_id>/', StockEntryDetailView.as_view(), name='stock-entry-detail'),
    path('stock/<int:entry_id>/update/', UpdateStockEntryView.as_view(), name='stock-entry-update'),
    path('stock/product/<int:product_id>/', ProductStockEntriesView.as_view(), name='product-stock-entries'),
    # admin
    path('admin/stock/', AdminAllStockEntriesView.as_view(), name='admin-all-stock-entries'),
]
