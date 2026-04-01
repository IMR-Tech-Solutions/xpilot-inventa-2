from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from .models import Customer
from .serializers import CustomerSerializer
from accounts.premissions import IsAdminRole, IsOwnerOrAdmin, HasModuleAccess


# Add-Customers View (GET)
class AddCustomerView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-customer"
    def post(self, request):
        serializer = CustomerSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# All-Customers View (GET) -- For Admin
class AllCustomersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    def get(self, request):
        customers = Customer.objects.all().order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(customers, request)
        serializer = CustomerSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


# Customers by user (GET) -- For Admin
class AllUserCustomersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    def get(self, request, user_id):
        customers = Customer.objects.filter(user_id=user_id).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(customers, request)
        serializer = CustomerSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


# Customers by logged-in user (GET) -- For User
class UserCustomersView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-customers"
    def get(self, request):
        user_id = request.user.id
        customers = Customer.objects.filter(user_id=user_id).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(customers, request)
        serializer = CustomerSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


# Update-Customer View (PUT)
class UpdateCustomerView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "update-customer"
    def put(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        self.check_object_permissions(request, customer)
        serializer = CustomerSerializer(customer, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Customer-Detail View (GET)
class CustomerDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    def get(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        self.check_object_permissions(request, customer)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)


# Customer-Delete View (DELETE)
class DeleteCustomerView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "delete-customer"
    def delete(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        self.check_object_permissions(request, customer)
        customer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
