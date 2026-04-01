from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from accounts.premissions import HasModuleAccess, IsAdminRole
from .models import Broker
from .serializers import BrokerSerializer

#GET all brokers for admin
class AdminBrokerView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    def get(self, request):
        brokers = Broker.objects.all().order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(brokers, request)
        serializer = BrokerSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
# Add Broker (POST)
class AddBrokerView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "broker-management"
    def post(self, request):
        serializer = BrokerSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# List User's Brokers (GET)
class UserBrokersView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "broker-management"
    
    def get(self, request):
        user_id = request.user.id
        brokers = Broker.objects.filter(created_by=user_id).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(brokers, request)
        serializer = BrokerSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
class UserActiveBrokersView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "broker-management"
    def get(self, request):
        user_id = request.user.id
        brokers = Broker.objects.filter(created_by=user_id,is_active=True).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(brokers, request)
        serializer = BrokerSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

# Broker Detail (GET)
class BrokerDetailView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "broker-management"
    
    def get(self, request, pk):
        broker = get_object_or_404(Broker, pk=pk, created_by=request.user)
        serializer = BrokerSerializer(broker)
        return Response(serializer.data)

# Update Broker (PUT)
class UpdateBrokerView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "broker-management"
    
    def put(self, request, pk):
        broker = get_object_or_404(Broker, pk=pk, created_by=request.user)
        serializer = BrokerSerializer(broker, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete Broker (DELETE)
class DeleteBrokerView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "broker-management"
    
    def delete(self, request, pk):
        broker = get_object_or_404(Broker, pk=pk, created_by=request.user)
        if broker.stock_batches.exists():
            return Response(
                {"error": "Cannot delete broker with associated stock batches"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        broker.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
