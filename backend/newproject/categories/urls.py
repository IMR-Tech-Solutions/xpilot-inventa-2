from django.urls import path
from .views import (
    AddCategoryView,
    AllCategoriesView,
    AllUserCategoriesView,
    UserCategoriesView,
    UpdateCategoryView,
    CategoryDetailView,
    DeleteCategoryView,
    ProductsInCategory,
    ShopCategoriesView,
    BulkAddCategoryView,
    UserStockedCategoriesView,
    CategoriesForShopOwners
)

urlpatterns = [
    # Admin urls
    path("admin/all-categories/", AllCategoriesView.as_view(), name="admin-all-categories"),
    path("admin/user-categories/<int:user_id>/", AllUserCategoriesView.as_view(), name="admin-categories-view-based-on-user"),
    #Common urls
    path("add-category/", AddCategoryView.as_view(), name="add-category"),
    #User urls
    path("my-categories/", UserCategoriesView.as_view(), name="categories-view-based-on-user"), 
    path("update-category/<int:pk>/", UpdateCategoryView.as_view(), name="update-category"),
    path("category/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path("delete-category/<int:pk>/", DeleteCategoryView.as_view(), name="delete-category"),
    path("add-categories/bulk/", BulkAddCategoryView.as_view(), name="delete-product"),
    #POS catgories
    path("user/stock/categories/", UserStockedCategoriesView.as_view(), name="stock-added-user"),
    #Products in category
    path("category/<int:category_id>/products/", ProductsInCategory.as_view(), name="products-in-category"),
    #SHOP
    path("shop/categories/", ShopCategoriesView.as_view(), name="all-categories"),
    path("shopowner-categories/", CategoriesForShopOwners.as_view(), name="all-categories"),
]
