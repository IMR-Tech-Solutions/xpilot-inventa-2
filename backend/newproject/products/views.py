from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from .models import Product, ProductUnit
from categories.models import Category
from .serializers import ProductSerializer,ProductBulkSerializer,ProductUnitSerializer
from accounts.premissions import IsAdminRole, IsOwnerOrAdmin, HasModuleAccess
from django.db.models import Q

# Add-product View (POST)
class AddProductView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-product"
    def post(self, request):
        serializer = ProductSerializer(data=request.data,context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# All-products View (GET) -- admin only
class AllProductsView(APIView):
    permission_classes = [IsAuthenticated,IsAdminRole]
    def get(self, request):
        products = Product.objects.all().order_by('id')
        paginator = PageNumberPagination()
        paginated_products = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(paginated_products, many=True,context={'request': request})
        return paginator.get_paginated_response(serializer.data)

#Products based on a user (GET)   -- For Admin
class AllUserProductsView(APIView):
    permission_classes = [IsAuthenticated,IsAdminRole]
    def get(self, request, user_id):
        products = Product.objects.filter(user_id=user_id).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(result_page, many=True,context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
# Products based on a user (GET) -- For User
class UserProductsView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess]
    required_permission = "view-products"
    def get(self, request):
        user_id = request.user.id
        products = Product.objects.filter(Q(user_id=user_id) | Q(user_id=1)).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(result_page, many=True,context={'request': request})
        return paginator.get_paginated_response(serializer.data)

# All products for current user
class UserStockedProductsView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-products"
    def get(self, request):
        user = request.user
        products = Product.objects.filter(user=user, current_stock__gt=0, is_active=True).order_by('product_name')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(result_page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

# Products based on a user -active  (GET) -- For User
class UserActiveProductsView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess]
    required_permission = "view-products"
    def get(self, request):
        user_id = request.user.id
        products = Product.objects.filter(Q(user_id=user_id) | Q(user_id=1),is_active=True).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(result_page, many=True,context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
# Update-product View (PUT)
class UpdateProductView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess,IsOwnerOrAdmin]
    required_permission = "update-product"
    def put(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        self.check_object_permissions(request, product)
        serializer = ProductSerializer(product, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#Product-Detail View (GET)
class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated,IsOwnerOrAdmin]
    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        self.check_object_permissions(request, product)
        serializer = ProductSerializer(product,context={'request': request})
        return Response(serializer.data)

#Product-Delete (DELETE)
class DeleteProductView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess,IsOwnerOrAdmin]
    required_permission = "delete-product"
    def delete(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        self.check_object_permissions(request, product)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

#bulk product addition
class BulkAddProductView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-product"
    def post(self, request):
        many = isinstance(request.data, list)
        serializer = ProductBulkSerializer(data=request.data, many=many, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#for shop products    
class ShopProductsView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"
    def get(self, request):
        products_with_stock = Product.objects.filter(
            current_stock__gt=0, is_active=True
        ).distinct().order_by('product_name')
        paginator = PageNumberPagination()
        paginated_products = paginator.paginate_queryset(products_with_stock, request)
        serializer = ProductSerializer(
            paginated_products,
            many=True,
            context={'request': request}
        )
        return paginator.get_paginated_response(serializer.data) 



class AddProductUnitView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-product"

    def post(self, request):
        serializer = ProductUnitSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# List Units (optionally by user)
class ListProductUnitView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-product"
    def get(self, request):
        qs = ProductUnit.objects.filter(user=request.user)
        paginator = PageNumberPagination()
        paginated_products = paginator.paginate_queryset(qs, request)
        serializer = ProductUnitSerializer(paginated_products, many=True)
        return paginator.get_paginated_response(serializer.data) 
        
# Retrieve Unit by id
class RetrieveProductUnitView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    def get(self, request, pk):
        unit = get_object_or_404(ProductUnit, pk=pk)
        self.check_object_permissions(request, unit)
        serializer = ProductUnitSerializer(unit)
        return Response(serializer.data)

# Update Unit
class UpdateProductUnitView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "add-product"
    def put(self, request, pk):
        unit = get_object_or_404(ProductUnit, pk=pk)
        self.check_object_permissions(request, unit)
        serializer = ProductUnitSerializer(unit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete Unit
class DeleteProductUnitView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "add-product"
    def delete(self, request, pk):
        unit = get_object_or_404(ProductUnit, pk=pk)
        self.check_object_permissions(request, unit)
        unit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)