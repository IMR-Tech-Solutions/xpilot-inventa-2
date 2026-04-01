from django.urls import path
from .views import (
    # ── Channel 1: POS Sales ──────────────────────────────────────────────────
    SalesRegisterView,
    AdminSalesRegisterView,
    ProductWiseSalesRegisterView,
    AdminProductWiseSalesRegisterView,

    # ── Purchase ──────────────────────────────────────────────────────────────
    PurchaseRegisterView,
    AdminPurchaseRegisterView,
    ProductWisePurchaseRegisterView,
    AdminProductWisePurchaseRegisterView,

    # ── Inventory ─────────────────────────────────────────────────────────────
    InventoryReportView,
    AdminInventoryReportView,

    # ── Channel 1: POS Receivables ────────────────────────────────────────────
    ReceivableReportView,
    AdminReceivableReportView,
    AgeWiseReceivableReportView,
    AdminAgeWiseReceivableReportView,

    # ── Channel 2: Shop Sales ─────────────────────────────────────────────────
    ShopSalesRegisterView,
    AdminShopSalesRegisterView,
    ProductWiseShopSalesRegisterView,
    AdminProductWiseShopSalesRegisterView,

    # ── Channel 2: Shop Receivables ───────────────────────────────────────────
    ShopReceivableReportView,
    AdminShopReceivableReportView,
    AgeWiseShopReceivableReportView,
    AdminAgeWiseShopReceivableReportView,
)
from .views2 import(StockLedgerSummaryView,AdminStockLedgerSummaryView)

urlpatterns = [
    # ── Channel 1: POS Sales ─────────────────────────────── User + Admin ────
    path('reports/sales-register/',                SalesRegisterView.as_view(),                     name='sales_register'),
    path('reports/product-wise-sales/',            ProductWiseSalesRegisterView.as_view(),          name='product_wise_sales_register'),
    path('admin/reports/sales-register/',          AdminSalesRegisterView.as_view(),                name='admin_sales_register'),
    path('admin/reports/product-wise-sales/',      AdminProductWiseSalesRegisterView.as_view(),     name='admin_product_wise_sales_register'),

    # ── Purchase ─────────────────────────────────────────── User + Admin ────
    path('reports/purchase-register/',             PurchaseRegisterView.as_view(),                  name='purchase_register'),
    path('reports/product-wise-purchase/',         ProductWisePurchaseRegisterView.as_view(),       name='product_wise_purchase_register'),
    path('admin/reports/purchase-register/',       AdminPurchaseRegisterView.as_view(),             name='admin_purchase_register'),
    path('admin/reports/product-wise-purchase/',   AdminProductWisePurchaseRegisterView.as_view(),  name='admin_product_wise_purchase_register'),

    # ── Inventory ────────────────────────────────────────── User + Admin ────
    path('reports/inventory/',                     InventoryReportView.as_view(),                   name='inventory_report'),
    path('admin/reports/inventory/',               AdminInventoryReportView.as_view(),              name='admin_inventory_report'),

    # ── Channel 1: POS Receivables ────────────────────────── User + Admin ───
    path('reports/receivable/',                    ReceivableReportView.as_view(),                  name='receivable_report'),
    path('reports/age-wise-receivable/',           AgeWiseReceivableReportView.as_view(),           name='age_wise_receivable_report'),
    path('admin/reports/receivable/',              AdminReceivableReportView.as_view(),             name='admin_receivable_report'),
    path('admin/reports/age-wise-receivable/',     AdminAgeWiseReceivableReportView.as_view(),      name='admin_age_wise_receivable_report'),

    # ── Channel 2: Shop Sales ─────────────────────────────── User + Admin ───
    path('reports/shop-sales-register/',           ShopSalesRegisterView.as_view(),                 name='shop_sales_register'),
    path('reports/product-wise-shop-sales/',       ProductWiseShopSalesRegisterView.as_view(),      name='product_wise_shop_sales_register'),
    path('admin/reports/shop-sales-register/',     AdminShopSalesRegisterView.as_view(),            name='admin_shop_sales_register'),
    path('admin/reports/product-wise-shop-sales/', AdminProductWiseShopSalesRegisterView.as_view(), name='admin_product_wise_shop_sales_register'),

    # ── Channel 2: Shop Receivables ──────────────────────── User + Admin ────
    path('reports/shop-receivable/',               ShopReceivableReportView.as_view(),              name='shop_receivable_report'),
    path('reports/age-wise-shop-receivable/',      AgeWiseShopReceivableReportView.as_view(),       name='age_wise_shop_receivable_report'),
    path('admin/reports/shop-receivable/',         AdminShopReceivableReportView.as_view(),         name='admin_shop_receivable_report'),
    path('admin/reports/age-wise-shop-receivable/', AdminAgeWiseShopReceivableReportView.as_view(), name='admin_age_wise_shop_receivable_report'),
    path('reports/stock-ledger/',StockLedgerSummaryView.as_view(),name="stock-leger"),
    path('admin/reports/stock-ledger/', AdminStockLedgerSummaryView.as_view(),           name='admin_stock_ledger_summary'),
]