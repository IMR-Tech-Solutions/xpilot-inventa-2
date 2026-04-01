from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from .models import StockEntry
from .serializers import (
    StockEntryCreateSerializer,
    BulkStockEntrySerializer,
    StockEntryListSerializer,
    StockEntryDetailSerializer,
    StockEntryUpdateSerializer,
)
from products.models import Product
from accounts.premissions import IsAdminRole


# Bulk add stock entries (one invoice, multiple products)
class BulkAddStockEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BulkStockEntrySerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            vendor_invoice, entries = serializer.save()
            return Response({
                'message': f'{len(entries)} stock entr{"y" if len(entries) == 1 else "ies"} added successfully.',
                'invoice_number': vendor_invoice.invoice_number,
                'invoice_id': vendor_invoice.id,
                'entries_created': len(entries),
            }, status=status.HTTP_201_CREATED)
        return Response({'error': 'Validation failed.', 'details': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)


# Add a single stock entry
class AddStockEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StockEntryCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            entry = serializer.save()
            return Response({
                'message': 'Stock added successfully.',
                'id': entry.id,
                'invoice_number': entry.vendor_invoice.invoice_number if entry.vendor_invoice else None,
            }, status=status.HTTP_201_CREATED)
        return Response({'error': 'Validation failed.', 'details': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)


# List all stock entries for the logged-in user
class StockEntryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = StockEntry.objects.filter(user=request.user).select_related(
            'product', 'vendor', 'broker', 'transporter', 'vendor_invoice'
        )

        vendor_id = request.query_params.get('vendor_id')
        broker_id = request.query_params.get('broker_id')
        transporter_id = request.query_params.get('transporter_id')
        product_id = request.query_params.get('product_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if vendor_id:
            entries = entries.filter(vendor_id=vendor_id)
        if broker_id:
            entries = entries.filter(broker_id=broker_id)
        if transporter_id:
            entries = entries.filter(transporter_id=transporter_id)
        if product_id:
            entries = entries.filter(product_id=product_id)
        if date_from:
            entries = entries.filter(created_at__date__gte=date_from)
        if date_to:
            entries = entries.filter(created_at__date__lte=date_to)

        paginator = PageNumberPagination()
        paginated = paginator.paginate_queryset(entries, request)
        serializer = StockEntryListSerializer(paginated, many=True)
        return paginator.get_paginated_response(serializer.data)


# Stock entries for a specific product
class ProductStockEntriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id, user=request.user)
        entries = StockEntry.objects.filter(
            product=product, user=request.user
        ).select_related('vendor', 'broker', 'transporter', 'vendor_invoice')

        serializer = StockEntryDetailSerializer(entries, many=True)
        return Response({
            'product_id': product.id,
            'product_name': product.product_name,
            'current_stock': product.current_stock,
            'stock_entries': serializer.data,
        })


# Detail view for a single stock entry
class StockEntryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, entry_id):
        entry = get_object_or_404(
            StockEntry.objects.select_related('product', 'vendor', 'broker', 'transporter', 'vendor_invoice'),
            pk=entry_id,
            user=request.user
        )
        serializer = StockEntryDetailSerializer(entry)
        return Response(serializer.data)


# Update optional fields of a stock entry (no quantity/vendor/product change)
class UpdateStockEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, entry_id):
        entry = get_object_or_404(StockEntry, pk=entry_id, user=request.user)
        serializer = StockEntryUpdateSerializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Stock entry updated successfully.'})
        return Response({'error': 'Validation failed.', 'details': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)


# Admin: all stock entries across all users
class AdminAllStockEntriesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        entries = StockEntry.objects.select_related(
            'product', 'vendor', 'broker', 'transporter', 'vendor_invoice', 'user'
        )
        paginator = PageNumberPagination()
        paginated = paginator.paginate_queryset(entries, request)
        serializer = StockEntryListSerializer(paginated, many=True)
        return paginator.get_paginated_response(serializer.data)
