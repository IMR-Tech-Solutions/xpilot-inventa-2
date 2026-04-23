from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from .models import Transporter
from .serializers import TransporterSerializer
from accounts.premissions import IsAdminRole, IsOwnerOrAdmin, HasModuleAccess


# Add Transporter (POST)
class AddTransporterView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "transporter-module"

    def post(self, request):
        serializer = TransporterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# All Transporters (GET) -- Admin
class AllTransportersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        transporters = Transporter.objects.all().order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(transporters, request)
        serializer = TransporterSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


# Transporters for specific user (GET) -- Admin
class AllUserTransportersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, user_id):
        transporters = Transporter.objects.filter(user_id=user_id).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(transporters, request)
        serializer = TransporterSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


# My Transporters (GET) -- User
class UserTransportersView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "transporter-module"

    def get(self, request):
        transporters = Transporter.objects.filter(user=request.user).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(transporters, request)
        serializer = TransporterSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
# My Transporters Active (GET) -- User
class UserActiveTransportersView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "transporter-module"

    def get(self, request):
        transporters = Transporter.objects.filter(user=request.user,is_active=True).order_by('id')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(transporters, request)
        serializer = TransporterSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


# Update Transporter (PUT)
class UpdateTransporterView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "transporter-module"

    def put(self, request, pk):
        transporter = get_object_or_404(Transporter, pk=pk)
        self.check_object_permissions(request, transporter)
        serializer = TransporterSerializer(transporter, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Transporter Detail (GET)
class TransporterDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get(self, request, pk):
        transporter = get_object_or_404(Transporter, pk=pk)
        self.check_object_permissions(request, transporter)
        serializer = TransporterSerializer(transporter)
        return Response(serializer.data)


# Delete Transporter (DELETE)
class DeleteTransporterView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "transporter-module"

    def delete(self, request, pk):
        transporter = get_object_or_404(Transporter, pk=pk)
        self.check_object_permissions(request, transporter)
        transporter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
