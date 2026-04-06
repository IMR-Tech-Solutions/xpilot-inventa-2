from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from .models import Customer, AnimalType, CustomerAnimal
from .serializers import CustomerSerializer, AnimalTypeSerializer, CustomerAnimalSerializer
from accounts.premissions import IsAdminRole, IsOwnerOrAdmin, HasModuleAccess


# Add-Customers View (POST)
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


# AnimalType List View (GET) -- returns all known animal types
class AnimalTypeListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        animal_types = AnimalType.objects.all().order_by('name')
        serializer = AnimalTypeSerializer(animal_types, many=True)
        return Response(serializer.data)


# Add Animal to Customer (POST)
class AddCustomerAnimalView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    def post(self, request, pk):
        customer = get_object_or_404(Customer, pk=pk)
        self.check_object_permissions(request, customer)

        animal_name = request.data.get('animal_name', '').strip()
        animal_type_id = request.data.get('animal_type_id')
        count = request.data.get('count')

        # Either pick existing animal type by id, or create new one by name
        if animal_type_id:
            animal_type = get_object_or_404(AnimalType, pk=animal_type_id)
        elif animal_name:
            animal_type, _ = AnimalType.objects.get_or_create(name__iexact=animal_name, defaults={'name': animal_name})
        else:
            return Response({'error': 'Provide animal_type_id or animal_name'}, status=status.HTTP_400_BAD_REQUEST)

        # If this customer already has this animal type, update count
        obj, created = CustomerAnimal.objects.get_or_create(
            customer=customer,
            animal_type=animal_type,
            defaults={'count': count}
        )
        if not created:
            obj.count = count
            obj.save()

        serializer = CustomerAnimalSerializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# Delete Animal from Customer (DELETE)
class DeleteCustomerAnimalView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        animal = get_object_or_404(CustomerAnimal, pk=pk)
        self.check_object_permissions(request, animal.customer)
        animal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
