from django.urls import path
from .views import (
    AddProductView, AllProductsView,AllUserProductsView,UserProductsView,UpdateProductView,ProductDetailView,DeleteProductView,UserActiveProductsView,BulkAddProductView,UserStockedProductsView,ShopProductsView,AddProductUnitView,ListProductUnitView,RetrieveProductUnitView,UpdateProductUnitView,DeleteProductUnitView
)

urlpatterns = [
    # Common urls
    path("add-product/", AddProductView.as_view(), name="add-product"),
    #admin urls
    path('admin/all-products/', AllProductsView.as_view(), name='admin-all-products'),
    path('admin/user-products/<int:user_id>/', AllUserProductsView.as_view(), name='admin-per-user-products'),
    #for users
    path('my-products/', UserProductsView.as_view(), name='particular-user-products'),
    path('active/my-products/', UserActiveProductsView.as_view(), name='particular-user-products-active'),
    path("update-product/<int:pk>/", UpdateProductView.as_view(), name="update-product"),
    path("product/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("delete-product/<int:pk>/", DeleteProductView.as_view(), name="delete-product"),
    path("add-products/bulk/", BulkAddProductView.as_view(), name="delete-product"),
    path("user/stock/products/", UserStockedProductsView.as_view(), name="stock-added-user"),
    path("shop/products/", ShopProductsView.as_view(), name="all-active-products"),
    path('unit/add/', AddProductUnitView.as_view(), name="add-productunit"),
    path('unit/all/', ListProductUnitView.as_view(), name="all-productunit"),
    path('unit/<int:pk>/', RetrieveProductUnitView.as_view(), name="retrieve-productunit"),
    path('unit/update/<int:pk>/', UpdateProductUnitView.as_view(), name="update-productunit"),
    path('unit/delete/<int:pk>/', DeleteProductUnitView.as_view(), name="delete-productunit"),
]
