from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum

from accounts.premissions import HasModuleAccess
from accounts.models import UserMaster
from usermodules.models import UserRoleModulePermission
from .models import ShopOwnerProducts, S2SOrder, S2SOrderItem, S2SPaymentTransaction


def _get_shop_owner_role_ids():
    return UserRoleModulePermission.objects.filter(
        module_permission='shop-access'
    ).values_list('user_role_id', flat=True)


def _recompute_s2s_order_status(order):
    items = order.order_items.all()
    total = items.count()
    if total == 0:
        return

    accepted = items.filter(item_status='accepted').count()
    rejected = items.filter(item_status='rejected').count()

    if accepted == total:
        order.status = 'accepted'
    elif accepted + rejected == total and accepted > 0:
        order.status = 'partially_accepted'
    elif rejected == total:
        order.status = 'cancelled'
    order.save(update_fields=['status'])


def _recompute_s2s_order_total(order):
    total = Decimal('0')
    for item in order.order_items.filter(item_status='accepted'):
        if item.fulfilled_quantity and item.actual_price:
            total += item.fulfilled_quantity * item.actual_price
    order.total_amount = total
    order.remaining_amount = total - order.amount_paid
    order.save(update_fields=['total_amount', 'remaining_amount'])


# ── Buyer: List available shops ───────────────────────────────────────────────

class S2SShopListView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    def get(self, request):
        role_ids = _get_shop_owner_role_ids()
        shops = UserMaster.objects.filter(
            user_type_id__in=role_ids,
            is_active=True
        ).exclude(id=request.user.id).order_by('business_name', 'first_name')

        data = [
            {
                'id': s.id,
                'business_name': s.business_name or f"{s.first_name} {s.last_name}".strip(),
                'owner_name': f"{s.first_name} {s.last_name}".strip(),
            }
            for s in shops
        ]
        return Response(data)


# ── Buyer: List seller's available products ───────────────────────────────────

class S2SShopProductsView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    def get(self, request, seller_id):
        role_ids = _get_shop_owner_role_ids()
        if not UserMaster.objects.filter(id=seller_id, user_type_id__in=role_ids, is_active=True).exists():
            return Response({'error': 'Shop not found.'}, status=status.HTTP_404_NOT_FOUND)

        products = ShopOwnerProducts.objects.filter(
            shop_owner_id=seller_id,
            is_active=True,
            quantity__gt=0
        ).select_related('product', 'product__unit', 'product__category')

        data = [
            {
                'seller_product_id': p.id,
                'product_name': p.product.product_name,
                'sku': p.product.sku_code or 'N/A',
                'unit': p.product.unit.unitName if p.product.unit else 'N/A',
                'category': p.product.category.category_name if p.product.category else 'N/A',
                'available_quantity': p.quantity,
                'product_image': request.build_absolute_uri(p.product.product_image.url) if p.product.product_image else None,
            }
            for p in products
        ]
        return Response(data)


# ── Buyer: Place S2S order ────────────────────────────────────────────────────

class PlaceS2SOrderView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    @transaction.atomic
    def post(self, request):
        seller_id = request.data.get('seller_id')
        items_data = request.data.get('items', [])

        if not seller_id:
            return Response({'error': 'seller_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not items_data:
            return Response({'error': 'At least one item is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if int(seller_id) == request.user.id:
            return Response({'error': 'Cannot place order to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        role_ids = _get_shop_owner_role_ids()
        try:
            seller = UserMaster.objects.get(id=seller_id, user_type_id__in=role_ids, is_active=True)
        except UserMaster.DoesNotExist:
            return Response({'error': 'Seller shop not found.'}, status=status.HTTP_404_NOT_FOUND)

        order = S2SOrder.objects.create(buyer=request.user, seller=seller)

        for item in items_data:
            sp_id = item.get('seller_product_id')
            qty = item.get('requested_quantity', 0)
            if not sp_id or int(qty) <= 0:
                continue
            try:
                seller_product = ShopOwnerProducts.objects.get(
                    id=sp_id, shop_owner=seller, is_active=True, quantity__gt=0
                )
            except ShopOwnerProducts.DoesNotExist:
                continue
            S2SOrderItem.objects.create(
                order=order,
                seller_product=seller_product,
                requested_quantity=int(qty),
            )

        if not order.order_items.exists():
            order.delete()
            return Response({'error': 'No valid items found.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': 'Order placed successfully.',
            'order_number': order.order_number,
            'order_id': order.id,
        }, status=status.HTTP_201_CREATED)


# ── Buyer: List own S2S orders ────────────────────────────────────────────────

class BuyerS2SOrdersListView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    def get(self, request):
        orders = S2SOrder.objects.filter(buyer=request.user).select_related('seller')
        data = []
        for o in orders:
            data.append({
                'id': o.id,
                'order_number': o.order_number,
                'seller_name': f"{o.seller.first_name} {o.seller.last_name}".strip(),
                'seller_business': o.seller.business_name or f"{o.seller.first_name} {o.seller.last_name}".strip(),
                'status': o.status,
                'total_amount': float(o.total_amount),
                'payment_status': o.payment_status,
                'items_count': o.order_items.count(),
                'created_at': o.created_at,
            })
        paginator = PageNumberPagination()
        return paginator.get_paginated_response(paginator.paginate_queryset(data, request))


# ── Buyer: S2S order detail ───────────────────────────────────────────────────

class BuyerS2SOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    def get(self, request, order_id):
        try:
            order = S2SOrder.objects.select_related('seller', 'delivery_transporter').get(
                id=order_id, buyer=request.user
            )
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        items = []
        for item in order.order_items.select_related('seller_product__product', 'seller_product__product__unit'):
            items.append({
                'id': item.id,
                'product_name': item.seller_product.product.product_name,
                'sku': item.seller_product.product.sku_code or 'N/A',
                'unit': item.seller_product.product.unit.unitName if item.seller_product.product.unit else 'N/A',
                'requested_quantity': item.requested_quantity,
                'fulfilled_quantity': item.fulfilled_quantity,
                'actual_price': float(item.actual_price) if item.actual_price else None,
                'total_price': float(item.fulfilled_quantity * item.actual_price) if item.fulfilled_quantity and item.actual_price else 0,
                'item_status': item.item_status,
            })

        from .invoice_views import build_transporter_context
        return Response({
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'total_amount': float(order.total_amount),
                'payment_status': order.payment_status,
                'created_at': order.created_at,
                'seller_name': f"{order.seller.first_name} {order.seller.last_name}".strip(),
                'seller_business': order.seller.business_name or '',
                'seller_phone': order.seller.mobile_number or 'N/A',
            },
            'items': items,
        })


# ── Buyer: Confirm delivery ───────────────────────────────────────────────────

class ConfirmS2SDeliveryView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    @transaction.atomic
    def post(self, request, order_id):
        try:
            order = S2SOrder.objects.get(id=order_id, buyer=request.user)
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'delivery_in_progress':
            return Response({'error': 'Order must be in delivery_in_progress to confirm.'}, status=status.HTTP_400_BAD_REQUEST)

        accepted_items = order.order_items.filter(item_status='accepted').select_related(
            'seller_product__product'
        )

        for item in accepted_items:
            product = item.seller_product.product
            existing = ShopOwnerProducts.objects.filter(
                shop_owner=request.user, product=product
            ).first()

            if existing:
                existing.quantity += item.fulfilled_quantity
                existing.save(update_fields=['quantity'])
            else:
                ShopOwnerProducts.objects.create(
                    shop_owner=request.user,
                    product=product,
                    quantity=item.fulfilled_quantity,
                    purchase_price=item.actual_price,
                    selling_price=item.actual_price,
                    source_manager=order.seller,
                )

        order.status = 'completed'
        order.save(update_fields=['status'])

        return Response({'message': 'Delivery confirmed. Products added to your inventory.'})


# ── Buyer: Cancel S2S order ───────────────────────────────────────────────────

class CancelS2SOrderView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    @transaction.atomic
    def put(self, request, order_id):
        try:
            order = S2SOrder.objects.get(id=order_id, buyer=request.user)
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status in ('completed', 'cancelled'):
            return Response({'error': f'Order is already {order.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        # Restore stock for any accepted items
        for item in order.order_items.filter(item_status='accepted'):
            sp = item.seller_product
            sp.quantity += item.fulfilled_quantity
            sp.save(update_fields=['quantity'])

        order.status = 'cancelled'
        order.save(update_fields=['status'])
        return Response({'message': 'Order cancelled.'})


# ── Seller: Incoming S2S orders ───────────────────────────────────────────────

class SellerS2SIncomingOrdersView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    def get(self, request):
        orders = S2SOrder.objects.filter(seller=request.user).select_related('buyer')
        data = []
        for o in orders:
            data.append({
                'id': o.id,
                'order_number': o.order_number,
                'buyer_name': f"{o.buyer.first_name} {o.buyer.last_name}".strip(),
                'buyer_business': o.buyer.business_name or f"{o.buyer.first_name} {o.buyer.last_name}".strip(),
                'status': o.status,
                'total_amount': float(o.total_amount),
                'payment_status': o.payment_status,
                'payment_method': o.payment_method,
                'amount_paid': float(o.amount_paid),
                'remaining_amount': float(o.remaining_amount),
                'online_amount': 0.0,
                'offline_amount': 0.0,
                'items_count': o.order_items.count(),
                'created_at': o.created_at,
            })
        paginator = PageNumberPagination()
        return paginator.get_paginated_response(paginator.paginate_queryset(data, request))


# ── Seller: S2S order detail ──────────────────────────────────────────────────

class SellerS2SOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    def get(self, request, order_id):
        try:
            order = S2SOrder.objects.select_related('buyer').get(id=order_id, seller=request.user)
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        items = []
        for item in order.order_items.select_related('seller_product__product', 'seller_product__product__unit'):
            items.append({
                'id': item.id,
                'product_name': item.seller_product.product.product_name,
                'sku': item.seller_product.product.sku_code or 'N/A',
                'unit': item.seller_product.product.unit.unitName if item.seller_product.product.unit else 'N/A',
                'requested_quantity': item.requested_quantity,
                'available_quantity': item.seller_product.quantity,
                'fulfilled_quantity': item.fulfilled_quantity,
                'actual_price': float(item.actual_price) if item.actual_price else None,
                'total_price': float(item.fulfilled_quantity * item.actual_price) if item.fulfilled_quantity and item.actual_price else 0,
                'item_status': item.item_status,
            })

        return Response({
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'total_amount': float(order.total_amount),
                'payment_status': order.payment_status,
                'created_at': order.created_at,
                'buyer_name': f"{order.buyer.first_name} {order.buyer.last_name}".strip(),
                'buyer_business': order.buyer.business_name or '',
                'buyer_phone': order.buyer.mobile_number or 'N/A',
                'buyer_email': order.buyer.email or 'N/A',
            },
            'items': items,
        })


# ── Seller: Accept S2S item ───────────────────────────────────────────────────

class SellerAcceptS2SItemView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    @transaction.atomic
    def post(self, request, order_id, item_id):
        try:
            order = S2SOrder.objects.get(id=order_id, seller=request.user)
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status in ('completed', 'cancelled'):
            return Response({'error': f'Order is already {order.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = S2SOrderItem.objects.get(id=item_id, order=order)
        except S2SOrderItem.DoesNotExist:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        if item.item_status != 'pending':
            return Response({'error': f'Item is already {item.item_status}.'}, status=status.HTTP_400_BAD_REQUEST)

        offered_qty = int(request.data.get('offered_quantity', item.requested_quantity))
        offered_price_raw = request.data.get('offered_price')

        if offered_qty <= 0:
            return Response({'error': 'Quantity must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
        if offered_qty > item.requested_quantity:
            return Response({'error': f'Cannot offer more than requested ({item.requested_quantity}).'}, status=status.HTTP_400_BAD_REQUEST)

        seller_product = item.seller_product
        if seller_product.quantity < offered_qty:
            return Response({'error': f'Insufficient stock. Available: {seller_product.quantity}.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            offered_price = Decimal(str(offered_price_raw)) if offered_price_raw else seller_product.selling_price
            if offered_price <= 0:
                return Response({'error': 'Price must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'Invalid price.'}, status=status.HTTP_400_BAD_REQUEST)

        # Reduce seller stock
        seller_product.quantity -= offered_qty
        seller_product.save(update_fields=['quantity'])

        item.fulfilled_quantity = offered_qty
        item.actual_price = offered_price
        item.item_status = 'accepted'
        item.save()

        _recompute_s2s_order_status(order)
        _recompute_s2s_order_total(order)

        return Response({'message': f'Item accepted. {offered_qty} units at ₹{offered_price} each.'})


# ── Seller: Reject S2S item ───────────────────────────────────────────────────

class SellerRejectS2SItemView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    @transaction.atomic
    def post(self, request, order_id, item_id):
        try:
            order = S2SOrder.objects.get(id=order_id, seller=request.user)
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            item = S2SOrderItem.objects.get(id=item_id, order=order)
        except S2SOrderItem.DoesNotExist:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        if item.item_status != 'pending':
            return Response({'error': f'Item is already {item.item_status}.'}, status=status.HTTP_400_BAD_REQUEST)

        item.item_status = 'rejected'
        item.save(update_fields=['item_status'])

        _recompute_s2s_order_status(order)

        return Response({'message': 'Item rejected.'})


# ── Seller: Update S2S order status ──────────────────────────────────────────

class SellerUpdateS2SOrderStatusView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    ALLOWED = {'packing', 'delivery_in_progress', 'cancelled'}
    LOCKED = {'completed', 'cancelled', 'delivery_in_progress'}

    def patch(self, request, order_id):
        new_status = request.data.get('status', '').strip()

        if not new_status or new_status not in self.ALLOWED:
            return Response({'error': f'Invalid status. Allowed: {", ".join(sorted(self.ALLOWED))}'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = S2SOrder.objects.get(id=order_id, seller=request.user)
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status in self.LOCKED:
            return Response({'error': f'Order is already {order.status}. No further changes allowed.'}, status=status.HTTP_403_FORBIDDEN)

        if not order.order_items.filter(item_status='accepted').exists():
            return Response({'error': 'No accepted items. Cannot update status.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status

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
        return Response({'message': f'Status updated to {new_status}.', 'order_status': new_status})


# ── Seller: Record payment ────────────────────────────────────────────────────

class RecordS2SPaymentView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = 'shop-access'

    @transaction.atomic
    def patch(self, request, order_id):
        try:
            order = S2SOrder.objects.get(id=order_id, seller=request.user, status='completed')
        except S2SOrder.DoesNotExist:
            return Response({'error': 'Order not found or not yet completed.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount_paid = Decimal(str(request.data.get('amount_paid', 0)))
            payment_method = request.data.get('payment_method', 'cash')
            online_amount = Decimal(str(request.data.get('online_amount', 0)))
            offline_amount = Decimal(str(request.data.get('offline_amount', 0)))
        except Exception:
            return Response({'error': 'Invalid payment values.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount_paid <= 0:
            return Response({'error': 'Payment amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        remaining_before = max(Decimal('0'), order.total_amount - order.amount_paid)
        if amount_paid > remaining_before:
            return Response({'error': f'Amount exceeds remaining balance of ₹{remaining_before}.'}, status=status.HTTP_400_BAD_REQUEST)

        if payment_method == 'mix':
            if online_amount + offline_amount != amount_paid:
                return Response({'error': 'Online + offline amounts must equal total amount paid.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            online_amount = Decimal('0')
            offline_amount = Decimal('0')

        previous_paid = order.amount_paid

        S2SPaymentTransaction.objects.create(
            order=order,
            amount=amount_paid,
            payment_method=payment_method,
            online_amount=online_amount,
            offline_amount=offline_amount,
            previous_paid=previous_paid,
            total_order_amount=order.total_amount,
            recorded_by=request.user,
        )

        order.amount_paid += amount_paid
        order.remaining_amount = max(Decimal('0'), order.total_amount - order.amount_paid)
        order.payment_method = payment_method

        if order.remaining_amount <= 0:
            order.payment_status = 'paid'
        elif order.amount_paid > 0:
            order.payment_status = 'partial'

        order.save()

        return Response({
            'message': 'Payment recorded.',
            'payment_status': order.payment_status,
            'payment_method': payment_method,
            'amount_paid': float(order.amount_paid),
            'remaining_amount': float(order.remaining_amount),
            'online_amount': float(online_amount),
            'offline_amount': float(offline_amount),
        })
