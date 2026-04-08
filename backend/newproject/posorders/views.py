from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from .models import POSOrder, POSOrderItem, POSPaymentTransaction
from .serializers import (
    POSOrderSerializer, POSOrderListSerializer,
    POSOrderStatusUpdateSerializer, POSShopOrderSerializer
)
from customers.models import Customer
from products.models import Product
from accounts.premissions import IsAdminRole, IsOwnerOrAdmin, HasModuleAccess
from utils.inventory_service import InventoryService


class AddPOSOrderView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-pos-order"

    def post(self, request):
        customer_id = request.data.get('customer')
        if customer_id:
            customer = get_object_or_404(Customer, pk=customer_id)
            self.check_object_permissions(request, customer)

        order_items = request.data.get('order_items', [])
        for item in order_items:
            product_id = item.get('product')
            if product_id:
                product = get_object_or_404(Product, pk=product_id)
                self.check_object_permissions(request, product)

        serializer = POSOrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AllPOSOrdersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        orders = POSOrder.objects.all().order_by('-created_at')
        paginator = PageNumberPagination()
        paginated_orders = paginator.paginate_queryset(orders, request)
        serializer = POSOrderListSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)


class AllUserPOSOrdersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, user_id):
        orders = POSOrder.objects.filter(user_id=user_id).order_by('-created_at')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(orders, request)
        serializer = POSOrderListSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class UserPOSOrdersView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-pos-orders"

    def get(self, request):
        orders = POSOrder.objects.filter(user_id=request.user.id).order_by('-created_at')
        paginator = PageNumberPagination()
        result_page = paginator.paginate_queryset(orders, request)
        serializer = POSOrderListSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class UpdatePOSOrderView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "update-pos-order"

    def put(self, request, pk):
        pos_order = get_object_or_404(POSOrder, pk=pk)
        self.check_object_permissions(request, pos_order)

        if 'order_items' in request.data:
            return Response(
                {'error': 'Cannot update order items after order creation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        previous_paid = pos_order.amount_paid
        previous_online = pos_order.online_amount
        previous_offline = pos_order.offline_amount

        serializer = POSOrderStatusUpdateSerializer(pos_order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Create a payment transaction record if a new payment was made
            new_paid = pos_order.amount_paid
            if new_paid > previous_paid:
                delta = new_paid - previous_paid
                delta_online = max(pos_order.online_amount - previous_online, 0)
                delta_offline = max(pos_order.offline_amount - previous_offline, 0)
                transaction_obj = POSPaymentTransaction.objects.create(
                    order=pos_order,
                    amount=delta,
                    payment_method=pos_order.payment_method,
                    online_amount=delta_online,
                    offline_amount=delta_offline,
                    previous_paid=previous_paid,
                    total_order_amount=pos_order.total_amount,
                    recorded_by=request.user,
                )
                data = serializer.data
                data['transaction_id'] = transaction_obj.id
                return Response(data)

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class POSOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get(self, request, pk):
        pos_order = get_object_or_404(POSOrder, pk=pk)
        self.check_object_permissions(request, pos_order)
        serializer = POSOrderSerializer(pos_order)
        return Response(serializer.data)


class CancelPOSOrderView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "cancel-pos-order"

    def put(self, request, pk):
        pos_order = get_object_or_404(POSOrder, pk=pk)
        self.check_object_permissions(request, pos_order)

        if pos_order.order_status in ['completed', 'cancelled']:
            return Response(
                {'error': f'Cannot cancel order with status: {pos_order.order_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rollback_messages = []
            for order_item in pos_order.order_items.all():
                success, message = InventoryService.rollback_stock(
                    order_item.product,
                    order_item.quantity
                )
                rollback_messages.append(f"{order_item.product.product_name}: {message}")
                if not success:
                    return Response(
                        {'error': 'Failed to rollback inventory', 'details': rollback_messages},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            pos_order.order_status = 'cancelled'
            pos_order.payment_status = 'refunded' if pos_order.payment_status == 'paid' else 'failed'
            pos_order.save()

            return Response({
                'message': 'Order cancelled successfully',
                'inventory_rollback': rollback_messages,
                'order': POSOrderSerializer(pos_order).data
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to cancel order: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from shop.models import ShopOwnerProducts

class AddShopPOSOrderView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "add-pos-order"

    def post(self, request):
        customer_id = request.data.get('customer')
        if customer_id:
            customer = get_object_or_404(Customer, pk=customer_id)
            self.check_object_permissions(request, customer)

        serializer = POSShopOrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
