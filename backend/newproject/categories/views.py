from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Category
from .serializers import CategorySerializer,CategoryBulkSerializer
from django.shortcuts import get_object_or_404
from accounts.premissions import IsAdminRole, IsOwnerOrAdmin, HasModuleAccess
from rest_framework.pagination import PageNumberPagination
from products.models import Product
from products.serializers import ProductSerializer

# Add-category View (POST)
class AddCategoryView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess]
    required_permission = "add-category"
    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# All-categories View (GET) -- For Admin
class AllCategoriesView(APIView):
    permission_classes = [IsAuthenticated,IsAdminRole]
    def get(self, request):
        categories = Category.objects.all().order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(categories, request)
        serializer = CategorySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

#Categories based on a user (GET)   -- For Admin
class AllUserCategoriesView(APIView):
    permission_classes = [IsAuthenticated,IsAdminRole]
    def get(self, request, user_id):
        categories = Category.objects.filter(user_id=user_id).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(categories, request)
        serializer = CategorySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

# Categories based on a user (GET)   -- For User
class UserCategoriesView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess]
    required_permission = "view-categories"
    def get(self, request):
        user_id = request.user.id
        categories = Category.objects.filter(user_id=user_id).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(categories, request)
        serializer = CategorySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

# Update-category View (PUT)
class UpdateCategoryView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess,IsOwnerOrAdmin]
    required_permission = "update-category"
    def put(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        self.check_object_permissions(request, category)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#Category-Detail View (GET)
class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated,IsOwnerOrAdmin]
    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        self.check_object_permissions(request, category)
        serializer = CategorySerializer(category)
        return Response(serializer.data)

#Category-Delete (DELETE)
class DeleteCategoryView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess,IsOwnerOrAdmin]
    required_permission = "delete-category"
    def delete(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        self.check_object_permissions(request, category)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

#GET PRODUCTS BASED ON CATEGORY
class ProductsInCategory(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, category_id):
        category = get_object_or_404(Category, pk=category_id)
        # self.check_object_permissions(request, category)
        products = Product.objects.filter(
            category=category,
            stock_batches__batch_status='active',
            stock_batches__quantity__gt=0
        ).distinct().order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(result_page, many=True,context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
class UserStockedCategoriesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        categories = Category.objects.filter(
            products__user=user,
            products__current_stock__gt=0
        ).distinct().order_by('category_name')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(categories, request)
        serializer = CategorySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

#bulk categories add 
class BulkAddCategoryView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-category"

    def post(self, request):
        many = isinstance(request.data, list)
        serializer = CategoryBulkSerializer(
            data=request.data,
            many=many,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#For Shop Categories
class ShopCategoriesView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess]
    required_permission = "shop-access"
    def get(self, request):
        categories = Category.objects.filter(products__current_stock__gt=0, products__is_active=True).distinct().order_by('category_name')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(categories, request)
        serializer = CategorySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

class CategoriesForShopOwners(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"
    def get(self, request):
        shop_owner = request.user
        categories = Category.objects.filter(
            products__shopownerproducts__shop_owner=shop_owner,products__shopownerproducts__is_active=True,products__shopownerproducts__quantity__gt=0
        ).distinct().order_by('category_name')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(categories, request)
        serializer = CategorySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
