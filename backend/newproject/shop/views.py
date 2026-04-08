from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import ManagerRequest, ShopOwnerProducts, ShopOwnerOrders, ShopPaymentTransaction
from .serializers import ManagerRequestListSerializer, ManagerRequestSerializer
from accounts.premissions import HasModuleAccess
from products.models import Product
from utils.inventory_service import InventoryService
from notifications.services import firebase_service


class ManagerPendingRequestsView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess ]
    required_permission = "shop-request"
    
    def get(self, request):
        manager = request.user
        pending_requests = ManagerRequest.objects.filter(
            manager=manager,
            status='pending'
        ).select_related('product', 'order_item__order').order_by('-created_at')
        
        paginator = PageNumberPagination()
        paginated_requests = paginator.paginate_queryset(pending_requests, request)
        
        serializer = ManagerRequestListSerializer(paginated_requests, many=True)
        return paginator.get_paginated_response(serializer.data)


class ManagerRequestDetailView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"
    
    def get(self, request, request_id):
        manager_request = get_object_or_404(
            ManagerRequest, 
            id=request_id, 
            manager=request.user
        )

        available_quantity, _ = InventoryService.get_available_stock(
            manager_request.product, user=request.user
        )
        
        serializer_data = ManagerRequestSerializer(manager_request).data

        product = manager_request.product
        product_selling_price = float(product.selling_price) if product.selling_price else None

        return Response({
            'request_details': serializer_data,
            'stock_info': {
                'available_quantity': available_quantity,
                'requested_quantity': manager_request.requested_quantity,
                'can_fulfill_fully': available_quantity >= manager_request.requested_quantity,
                'shortage': max(0, manager_request.requested_quantity - available_quantity),
                'product_selling_price': product_selling_price,
            }
        })


from django.db.models import F, DecimalField
class ManagerAcceptRequestView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"
    
    @transaction.atomic
    def post(self, request, request_id):
        manager_request = get_object_or_404(
            ManagerRequest,
            id=request_id,
            manager=request.user,
            status='pending'
        )
    
        offered_quantity = int(request.data.get('offered_quantity', manager_request.requested_quantity))
        if offered_quantity <= 0:
            return Response({
                'error': 'Offered quantity must be greater than 0'
            }, status=status.HTTP_400_BAD_REQUEST)

        if offered_quantity > manager_request.requested_quantity:
            return Response({
                'error': f'Cannot offer more than requested quantity. Requested: {manager_request.requested_quantity}, Offered: {offered_quantity}'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            available_qty, _ = InventoryService.get_available_stock(
                manager_request.product, user=request.user
            )
            if available_qty < offered_quantity:
                return Response({
                    'error': f'Insufficient stock. Available: {available_qty}, Requested: {offered_quantity}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Manager sets the selling price; default = product.selling_price, fallback = expected_price
            offered_price_input = request.data.get('offered_price')
            if offered_price_input is not None:
                try:
                    final_offered_price = Decimal(str(offered_price_input))
                    if final_offered_price <= 0:
                        return Response({'error': 'Offered price must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
                except Exception:
                    return Response({'error': 'Invalid offered price'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                product = manager_request.product
                final_offered_price = product.selling_price if product.selling_price else manager_request.order_item.expected_price
            original_requested = manager_request.requested_quantity
            manager_request.status = 'accepted'
            manager_request.offered_price = final_offered_price
            manager_request.response_date = timezone.now()
            manager_request.save()
            try:
                shop_owner = manager_request.order_item.order.shop_owner
                manager_name = f"{request.user.first_name} {request.user.last_name}"
                notification_result = firebase_service.notify_shop_owner_request_accepted(
                    shop_owner_id=shop_owner.id,
                    manager_name=manager_name,
                    product_name=manager_request.product.product_name,
                    quantity=offered_quantity,
                    request_id=manager_request.id
                )
                if notification_result['success']:
                    print(f"Shop owner {shop_owner.id} notified about accepted request {manager_request.id}")
                else:
                    print(f"Failed to notify shop owner: {notification_result['error']}")
            except Exception as e:
                print(f"Error sending notification to shop owner: {e}")

            ManagerRequest.objects.filter(
                order_item=manager_request.order_item,
                status='pending'
            ).exclude(id=manager_request.id).update(
                status='cancelled',
                response_date=timezone.now()
            )
            fulfillment_result = self._fulfill_request(
                manager_request,
                offered_quantity,
                final_offered_price
            )
            
            if fulfillment_result['success']:
                return Response({
                    'message': f'Request accepted! {offered_quantity} units !',
                    'partial_fulfillment': offered_quantity < original_requested,
                    'original_requested': original_requested,
                    'quantity_fulfilled': offered_quantity,
                    'price_per_unit': final_offered_price,
                    'request': ManagerRequestSerializer(manager_request).data,
                    'fulfillment': fulfillment_result
                })
            else:
                return Response({
                    'error': 'Request accepted but fulfillment failed',
                    'details': fulfillment_result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Failed to accept request: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({
                'error': f'Failed to accept request: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _fulfill_request(self, manager_request, offered_quantity, offered_price):
        try:
            success, message, _, _ = InventoryService.reduce_stock(
                manager_request.product, offered_quantity, user=manager_request.manager
            )
            if not success:
                return {'success': False, 'error': message}

            order_item = manager_request.order_item
            order_item.fulfilled_by_manager = manager_request.manager
            order_item.fulfilled_quantity = offered_quantity
            order_item.actual_price = offered_price
            order_item.save()

            self._check_order_completion(order_item.order)
            self._update_order_total(order_item.order)

            remaining, _ = InventoryService.get_available_stock(
                manager_request.product, user=manager_request.manager
            )
            return {
                'success': True,
                'message': f'Successfully prepared {offered_quantity} units to delivery',
                'manager_remaining_stock': remaining,
                'order_status': order_item.order.status,
                'delivery_status': 'Products prepared, awaiting delivery confirmation'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _check_order_completion(self, shop_order):
        total_items = shop_order.order_items.count()
        fulfilled_items = shop_order.order_items.filter(
            fulfilled_by_manager__isnull=False
        ).count()
        
        if fulfilled_items == total_items:
            shop_order.status = 'packing'           # FIX 1: was 'delivery_in_progress'
        elif fulfilled_items > 0:
            shop_order.status = 'partially_fulfilled'
        else:
            shop_order.status = 'order_placed'
        shop_order.save()

    def _update_order_total(self, shop_order):
        from django.db.models import Sum
        result = shop_order.order_items.filter(
            fulfilled_by_manager__isnull=False 
        ).aggregate(
            total=Sum(
                F('fulfilled_quantity') * F('actual_price'),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )
        shop_order.total_amount = result['total'] or 0
        shop_order.save()
        print(f"Updated order {shop_order.order_number} total to ₹{shop_order.total_amount}")


class ManagerRejectRequestView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess ]
    required_permission = "shop-request"
    
    def post(self, request, request_id):
        manager_request = get_object_or_404(
            ManagerRequest,
            id=request_id,
            manager=request.user,
            status='pending'
        )
        
        manager_request.status = 'rejected'
        manager_request.response_date = timezone.now()
        manager_request.manager_response_notes = request.data.get('reason', 'No reason provided')
        manager_request.save()
        
        return Response({
            'message': 'Request rejected successfully',
            'request': ManagerRequestSerializer(manager_request).data
        })


class ManagerRequestHistoryView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"
    
    def get(self, request):
        manager = request.user
        request_status = request.query_params.get('status', None)
        
        requests_query = ManagerRequest.objects.filter(manager=manager)
        
        if request_status:
            requests_query = requests_query.filter(status=request_status)
        
        requests = requests_query.select_related(
            'product', 'order_item__order'
        ).order_by('-created_at')
        
        paginator = PageNumberPagination()
        paginated_requests = paginator.paginate_queryset(requests, request)
        
        serializer = ManagerRequestListSerializer(paginated_requests, many=True)
        return paginator.get_paginated_response(serializer.data)


from .models import ShopOwnerOrders, ShopOrderItem, ShopOwnerProducts
from .serializers import ShopOwnerOrderSerializer, ShopOrderListSerializer, ShopOwnerProductsSerializer
from .services import ShopOrderDistributionService

class PlaceShopOrderView(APIView):
    """Shop owner places an order to managers"""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"
    @transaction.atomic
    def post(self, request):
        serializer = ShopOwnerOrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            distribution_result = ShopOrderDistributionService.distribute_order_to_managers(order.id)
            
            if distribution_result['success']:
                return Response({
                    'message': 'Order placed successfully and distributed to managers',
                    'order': ShopOwnerOrderSerializer(order).data,
                    'distribution': distribution_result['distribution_results']
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Order created but distribution failed',
                    'order': ShopOwnerOrderSerializer(order).data,
                    'distribution_error': distribution_result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ShopOwnerOrdersView(APIView):
    """View all orders placed by shop owner"""
    permission_classes = [IsAuthenticated,HasModuleAccess ]
    required_permission = "shop-access"
    
    def get(self, request):
        shop_owner = request.user
        status_filter = request.query_params.get('status', None)
        
        orders_query = ShopOwnerOrders.objects.filter(shop_owner=shop_owner)
        
        if status_filter:
            orders_query = orders_query.filter(status=status_filter)
        
        orders = orders_query.order_by('-created_at')
        
        paginator = PageNumberPagination()
        paginated_orders = paginator.paginate_queryset(orders, request)
        
        serializer = ShopOrderListSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)


class ShopOwnerOrderDetailView(APIView):
    """View detailed information about a specific order"""
    permission_classes = [IsAuthenticated, HasModuleAccess ]
    required_permission = "shop-access"
    
    def get(self, request, order_id):
        order = get_object_or_404(
            ShopOwnerOrders,
            id=order_id,
            shop_owner=request.user
        )
        
        serializer = ShopOwnerOrderSerializer(order)
        
        manager_requests = []
        for order_item in order.order_items.all():
            item_requests = order_item.manager_requests.select_related('manager').all()
            for req in item_requests:
                manager_requests.append({
                    'product_name': req.product.product_name,
                    'manager_name': f"{req.manager.first_name} {req.manager.last_name}",
                    'requested_quantity': req.requested_quantity,
                    'status': req.status,
                    'offered_price': req.offered_price,
                    'response_date': req.response_date
                })
        
        return Response({
            'order': serializer.data,
            'manager_requests': manager_requests
        })


class ShopOwnerProductsView(APIView):
    """View products owned by shop owner (their inventory)"""
    permission_classes = [IsAuthenticated,HasModuleAccess ]
    required_permission = "shop-access"
    def get(self, request):
        shop_owner = request.user
        owned_products = ShopOwnerProducts.objects.filter(
            shop_owner=shop_owner,
            quantity__gt=0  
        ).select_related('product', 'source_manager').order_by('product__product_name')
        paginator = PageNumberPagination()
        paginated_products = paginator.paginate_queryset(owned_products, request)
        serializer = ShopOwnerProductsSerializer(paginated_products, many=True)
        return paginator.get_paginated_response(serializer.data)
    
class ShopOwnerActiveProductsView(APIView):
    """View Active products owned by shop owner (their inventory)"""
    permission_classes = [IsAuthenticated,HasModuleAccess ]
    required_permission = "shop-access"
    def get(self, request):
        shop_owner = request.user
        owned_products = ShopOwnerProducts.objects.filter(
            shop_owner=shop_owner,
            is_active=True,
            quantity__gt=0  
        ).select_related('product', 'source_manager').order_by('product__product_name')
        paginator = PageNumberPagination()
        paginated_products = paginator.paginate_queryset(owned_products, request)
        serializer = ShopOwnerProductsSerializer(paginated_products, many=True)
        return paginator.get_paginated_response(serializer.data)


class CancelShopOrderView(APIView):
    """Cancel a shop owner order (only if not yet fulfilled)"""
    permission_classes = [IsAuthenticated, HasModuleAccess ]
    required_permission = "shop-access"
    @transaction.atomic
    def put(self, request, order_id):
        order = get_object_or_404(
            ShopOwnerOrders,
            id=order_id,
            shop_owner=request.user
        )
        
        if order.status in ['completed', 'cancelled']:
            return Response({
                'error': f'Cannot cancel order with status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            from .models import ManagerRequest
            from django.db.models import F

            # Restore stock for all fulfilled items (stock was deducted on acceptance)
            fulfilled_items = order.order_items.filter(
                fulfilled_by_manager__isnull=False,
                fulfilled_quantity__isnull=False
            ).select_related('product')

            for item in fulfilled_items:
                Product.objects.filter(pk=item.product.pk).update(
                    current_stock=F('current_stock') + item.fulfilled_quantity
                )

            # Cancel all non-cancelled manager requests for this order
            cancelled_requests = ManagerRequest.objects.filter(
                order_item__order=order
            ).exclude(status='cancelled').update(
                status='cancelled',
                response_date=timezone.now()
            )

            order.status = 'cancelled'
            order.save()

            return Response({
                'message': f'Order cancelled successfully. Stock restored for {fulfilled_items.count()} fulfilled items.',
                'order': ShopOwnerOrderSerializer(order).data
            })

        except Exception as e:
            return Response({
                'error': f'Failed to cancel order: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ShopOrderStatusView(APIView):
    """Get order fulfillment status summary"""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"
    def get(self, request, order_id):
        order = get_object_or_404(
            ShopOwnerOrders,
            id=order_id,
            shop_owner=request.user
        )
        total_items = order.order_items.count()
        fulfilled_items = order.order_items.filter(fulfilled_by_manager__isnull=False).count()
        pending_items = total_items - fulfilled_items
        items_status = []
        for item in order.order_items.all():
            items_status.append({
                'item_id': item.id,
                'product_name': item.product.product_name,
                'requested_quantity': item.requested_quantity,
                'fulfilled_quantity': item.fulfilled_quantity or 0,
                'fulfilled_by_manager': f"{item.fulfilled_by_manager.first_name} {item.fulfilled_by_manager.last_name}" if item.fulfilled_by_manager else None,
                'actual_price': item.actual_price,
                'status': 'fulfilled' if item.fulfilled_by_manager else 'pending'
            })
        
        return Response({
            'order_number': order.order_number,
            'order_status': order.status,
            'fulfillment_summary': {
                'total_items': total_items,
                'fulfilled_items': fulfilled_items,
                'pending_items': pending_items,
                'completion_percentage': round((fulfilled_items / total_items) * 100, 2) if total_items > 0 else 0
            },
            'items_status': items_status,
            'total_amount': order.total_amount,
            'created_at': order.created_at
        })


class UpdateShopOwnerProductPriceView(APIView):
    permission_classes = [IsAuthenticated,HasModuleAccess ]
    required_permission = "shop-access"
    
    def put(self, request, product_id):
        shop_owner_product = get_object_or_404(
            ShopOwnerProducts,
            id=product_id,
            shop_owner=request.user
        )
        
        new_selling_price = request.data.get('selling_price')
        try:
            new_selling_price = Decimal(new_selling_price)
        except (TypeError):
            return Response({"error": "Invalid selling price"},status=status.HTTP_400_BAD_REQUEST)
        
        if not new_selling_price or new_selling_price <= 0:
            return Response({
                'error': 'Valid selling price is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if Decimal(new_selling_price) < shop_owner_product.purchase_price:
            return Response({
                'error': f'Selling price cannot be below purchase price: ₹{shop_owner_product.purchase_price}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shop_owner_product.selling_price = new_selling_price
        shop_owner_product.save()
        
        profit_margin = ((Decimal(new_selling_price) - shop_owner_product.purchase_price) / shop_owner_product.purchase_price) * 100
        
        return Response({
            'message': 'Selling price updated successfully',
            'product': ShopOwnerProductsSerializer(shop_owner_product).data,
            'profit_margin': round(profit_margin, 2)
        })


class ShopOwnerConfirmDeliveryView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"    
    @transaction.atomic
    def post(self, request, order_id):
        shop_order = ShopOwnerOrders.objects.filter(
            id=order_id,
            shop_owner=request.user,
            status__in=['packing', 'delivery_in_progress', 'partially_fulfilled']
        ).first()
        if not shop_order:
            return Response(
                {'error': 'Order not found or not ready for delivery confirmation.'},
                status=status.HTTP_404_NOT_FOUND
            )
        products_added = 0
        for order_item in shop_order.order_items.all():
            if order_item.fulfilled_by_manager:  
                shop_owner_product, created = ShopOwnerProducts.objects.get_or_create(
                    shop_owner=request.user,
                    product=order_item.product,
                    defaults={
                        'quantity': order_item.fulfilled_quantity,
                        'purchase_price': order_item.actual_price,
                        'selling_price': order_item.actual_price,
                        'source_manager': order_item.fulfilled_by_manager,
                        'delivery_confirmed': True,
                        'is_active': True,
                    }
                )
                
                if not created:
                    shop_owner_product.quantity += order_item.fulfilled_quantity
                    shop_owner_product.purchase_price = order_item.actual_price
                    shop_owner_product.is_active = True
                    shop_owner_product.delivery_confirmed = True
                    shop_owner_product.save()
                
                products_added += 1

        ManagerRequest.objects.filter(
            order_item__order=shop_order,
            status='accepted'
        ).update(status='fulfilled')

        shop_order.status = 'completed'
        shop_order.remaining_amount = shop_order.total_amount
        shop_order.amount_paid = 0
        shop_order.payment_status = 'pending'
        shop_order.save()

        return Response({
            'message': f'Delivery confirmed! {products_added} products added to your inventory',
            'order_status': 'completed',
            'products_added': products_added
        })


class UpdateShopOrderPaymentView(APIView):
    """Manager/Admin records payment received from a shop owner for a completed order."""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"

    @transaction.atomic
    def patch(self, request, order_id):
        order = ShopOwnerOrders.objects.filter(
            id=order_id,
            order_items__fulfilled_by_manager=request.user,
            status='completed'
        ).distinct().first()

        if not order:
            return Response(
                {'error': 'Order not found or not yet completed.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            amount_paid = Decimal(str(request.data.get('amount_paid', order.amount_paid)))
            payment_method = request.data.get('payment_method', order.payment_method)
            online_amount = Decimal(str(request.data.get('online_amount', 0)))
            offline_amount = Decimal(str(request.data.get('offline_amount', 0)))
        except Exception:
            return Response({'error': 'Invalid payment values.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount_paid < 0:
            return Response({'error': 'Amount paid cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount_paid > order.total_amount:
            return Response({'error': 'Amount paid cannot exceed total order amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if payment_method == 'mix':
            if online_amount + offline_amount != amount_paid:
                return Response(
                    {'error': 'Online + offline amounts must equal total amount paid.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            online_amount = Decimal('0')
            offline_amount = Decimal('0')

        remaining = order.total_amount - amount_paid
        if remaining <= 0:
            payment_status = 'paid'
            remaining = Decimal('0')
        elif amount_paid > 0:
            payment_status = 'partial'
        else:
            payment_status = 'pending'

        previous_paid = order.amount_paid
        previous_online = order.online_amount
        previous_offline = order.offline_amount

        order.amount_paid = amount_paid
        order.remaining_amount = remaining
        order.payment_status = payment_status
        order.payment_method = payment_method
        order.online_amount = online_amount
        order.offline_amount = offline_amount
        order.save()

        transaction_id = None
        if amount_paid > previous_paid:
            delta = amount_paid - previous_paid
            delta_online = max(online_amount - previous_online, Decimal('0'))
            delta_offline = max(offline_amount - previous_offline, Decimal('0'))
            txn = ShopPaymentTransaction.objects.create(
                order=order,
                amount=delta,
                payment_method=payment_method,
                online_amount=delta_online,
                offline_amount=delta_offline,
                previous_paid=previous_paid,
                total_order_amount=order.total_amount,
                recorded_by=request.user,
            )
            transaction_id = txn.id

        return Response({
            'message': 'Payment updated successfully.',
            'order_id': order.id,
            'order_number': order.order_number,
            'total_amount': float(order.total_amount),
            'amount_paid': float(order.amount_paid),
            'remaining_amount': float(order.remaining_amount),
            'payment_status': order.payment_status,
            'payment_method': order.payment_method,
            'online_amount': float(order.online_amount),
            'offline_amount': float(order.offline_amount),
            'transaction_id': transaction_id,
        })


class ToggleShopProductActiveView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"
    
    def post(self, request, product_id):
        shop_product = get_object_or_404(
            ShopOwnerProducts,
            id=product_id,
            shop_owner=request.user,
        )
        
        shop_product.is_active = not shop_product.is_active
        shop_product.save()
        
        status_text = "activated" if shop_product.is_active else "deactivated"
        return Response({
            'message': f'Product {status_text} successfully',
            'product_name': shop_product.product.product_name,
            'is_active': shop_product.is_active
        })


class ShopOwnerProductPurchaseHistoryView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"
    
    def get(self, request, product_id):
        try:
            shop_product = get_object_or_404(
                ShopOwnerProducts,
                id=product_id,
                shop_owner=request.user
            )
            
            purchase_history = []
            
            order_items = ShopOrderItem.objects.filter(
                product=shop_product.product,
                order__shop_owner=request.user,
                fulfilled_by_manager__isnull=False
            ).select_related('order').order_by('-order__created_at')
            
            for order_item in order_items:
                purchase_history.append({
                    'purchase_date': order_item.order.created_at.date(),
                    'quantity': order_item.fulfilled_quantity,
                    'order_number': order_item.order.order_number,
                    'purchase_price': order_item.actual_price,
                    'manager_name': f"{order_item.fulfilled_by_manager.first_name} {order_item.fulfilled_by_manager.last_name}",
                    'order_status': order_item.order.status
                })
            
            return Response({
                'product_info': {
                    'product_name': shop_product.product.product_name,
                    'product_sku': shop_product.product.sku_code,
                    'current_quantity': shop_product.quantity,
                    'current_selling_price': shop_product.selling_price,
                    'is_active': shop_product.is_active
                },
                'purchase_history': purchase_history,
                'total_purchases': len(purchase_history),
                'total_quantity_purchased': sum(item['quantity'] for item in purchase_history)
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch purchase history: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ManagerFulfilledOrdersListView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"
    
    def get(self, request):
        fulfilled_orders = ShopOwnerOrders.objects.filter(
            order_items__fulfilled_by_manager=request.user
        ).distinct().select_related('shop_owner').prefetch_related('order_items')
        
        orders_data = []
        for order in fulfilled_orders:
            manager_items = order.order_items.filter(
                fulfilled_by_manager=request.user
            )
            
            total_amount = sum(
                item.fulfilled_quantity * item.actual_price 
                for item in manager_items
            )
            
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}",
                'order_status': order.status,
                'items_count': manager_items.count(),
                'total_amount': float(order.total_amount),
                'payment_status': order.payment_status,
                'payment_method': order.payment_method,
                'amount_paid': float(order.amount_paid),
                'remaining_amount': float(order.remaining_amount),
                'online_amount': float(order.online_amount),
                'offline_amount': float(order.offline_amount),
                'created_at': order.created_at,
            })
        
        paginator = PageNumberPagination()
        paginated_orders = paginator.paginate_queryset(orders_data, request)
        return paginator.get_paginated_response(paginated_orders)


class ManagerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"
    
    def get(self, request, order_id):
        # FIX 2: was get_object_or_404 with a JOIN — causes MultipleObjectsReturned
        # when the manager fulfilled multiple items in the same order
        order = ShopOwnerOrders.objects.filter(
            id=order_id,
            order_items__fulfilled_by_manager=request.user
        ).distinct().first()

        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        manager_items = order.order_items.filter(
            fulfilled_by_manager=request.user
        ).select_related('product')
        
        items_data = []
        total_amount = 0
        
        for item in manager_items:
            item_total = item.fulfilled_quantity * item.actual_price
            total_amount += item_total
            
            items_data.append({
                'product_name': item.product.product_name,
                'product_sku': item.product.sku_code,
                'quantity': item.fulfilled_quantity,
                'unit_price': item.actual_price,
                'total_price': item_total,
            })
        
        return Response({
            'order_number': order.order_number,
            'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}",
            'shop_owner_mobile_number': order.shop_owner.mobile_number,
            'shop_owner_email': order.shop_owner.email,
            'order_status': order.status,
            'created_at': order.created_at,
            'items': items_data,
            'total_amount': total_amount,
        })


class ManagerUpdateOrderStatusView(APIView):
    """
    Manager can update order status to: packing, delivery_in_progress, cancelled.
    'completed' is exclusively set by the shop owner via confirm-delivery.
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"

    MANAGER_ALLOWED_STATUSES = {'packing', 'delivery_in_progress', 'cancelled'}
    LOCKED_STATUSES = {'completed', 'cancelled'}

    def patch(self, request, order_id):
        new_status = request.data.get('status', '').strip()

        if not new_status:
            return Response(
                {'error': 'status field is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status not in self.MANAGER_ALLOWED_STATUSES:
            return Response(
                {
                    'error': f'Invalid status. Manager can only set: '
                             f'{", ".join(sorted(self.MANAGER_ALLOWED_STATUSES))}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # FIX 3: was get_object_or_404 with a JOIN — causes MultipleObjectsReturned
        # when the manager fulfilled multiple items in the same order
        order = ShopOwnerOrders.objects.filter(
            id=order_id,
            order_items__fulfilled_by_manager=request.user
        ).distinct().first()

        if not order:
            return Response(
                {'error': 'Order not found or you do not have access to it.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status in self.LOCKED_STATUSES:
            return Response(
                {'error': f'Order is already {order.status}. No further status changes are allowed.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if new_status == 'completed':
            return Response(
                {'error': 'completed status can only be set by the shop owner upon delivery confirmation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        old_status = order.status
        order.status = new_status

        # If moving to delivery_in_progress, save optional transporter/delivery details
        if new_status == 'delivery_in_progress':
            from transport.models import Transporter
            transporter_id = request.data.get('delivery_transporter')
            if transporter_id:
                try:
                    order.delivery_transporter = Transporter.objects.get(id=transporter_id)
                except Transporter.DoesNotExist:
                    pass
            order.delivery_from = request.data.get('delivery_from') or None
            order.delivery_to = request.data.get('delivery_to') or None
            cost = request.data.get('delivery_transporter_cost')
            order.delivery_transporter_cost = cost if cost not in (None, '', 0, '0') else None

        order.save()

        return Response({
            'message': f'Order status updated from {old_status} to {new_status}.',
            'order_number': order.order_number,
            'order_status': order.status,
        })