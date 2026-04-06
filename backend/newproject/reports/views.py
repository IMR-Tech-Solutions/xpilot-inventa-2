from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q

from accounts.premissions import IsAdminRole, HasModuleAccess
from accounts.models import UserMaster
from posorders.models import POSOrder
from customers.models import Customer
from inventory.models import StockEntry
from vendors.models import Vendor
from broker.models import Broker
from shop.models import ShopOrderItem, ShopOwnerOrders


class UserSalesReportView(APIView):
    """Logged-in user: their own POS sales report with optional date range filter."""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-sales-report"

    def get(self, request):
        qs = POSOrder.objects.filter(user=request.user)

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        customer_id = request.query_params.get('customer_id')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        if customer_id:
            qs = qs.filter(customer__id=customer_id)

        agg = qs.aggregate(
            total_orders=Count('id'),
            total_revenue=Sum('total_amount'),
            total_paid=Sum('amount_paid'),
            total_remaining=Sum('remaining_amount'),
            completed=Count('id', filter=Q(order_status='completed')),
            pending=Count('id', filter=Q(order_status='pending')),
            cancelled=Count('id', filter=Q(order_status='cancelled')),
        )

        orders = []
        for o in qs.select_related('customer').prefetch_related('order_items__product').order_by('-created_at'):
            items = []
            for item in o.order_items.all():
                items.append({
                    'product_name': item.product.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                })
            orders.append({
                'id': o.id,
                'order_number': o.order_number,
                'customer_name': f"{o.customer.first_name} {o.customer.last_name}",
                'customer_phone': o.customer.phone,
                'order_status': o.order_status,
                'payment_status': o.payment_status,
                'payment_method': o.payment_method,
                'subtotal': float(o.subtotal),
                'total_amount': float(o.total_amount),
                'amount_paid': float(o.amount_paid),
                'remaining_amount': float(o.remaining_amount),
                'notes': o.notes,
                'created_at': o.created_at,
                'items': items,
            })

        # Customers belonging to this user — for filter dropdown
        customers = list(
            Customer.objects
            .filter(user=request.user)
            .order_by('first_name')
            .values('id', 'first_name', 'last_name', 'phone')
        )

        return Response({
            'summary': {
                'total_orders': agg['total_orders'] or 0,
                'total_revenue': float(agg['total_revenue'] or 0),
                'total_paid': float(agg['total_paid'] or 0),
                'total_remaining': float(agg['total_remaining'] or 0),
                'completed': agg['completed'] or 0,
                'pending': agg['pending'] or 0,
                'cancelled': agg['cancelled'] or 0,
            },
            'orders': orders,
            'customers': customers,
        })


class AdminSalesReportView(APIView):
    """Admin: all POS sales across all users, with date range and user filter."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = POSOrder.objects.select_related('user', 'customer').all()

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        user_id = request.query_params.get('user_id')

        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        if user_id:
            qs = qs.filter(user__id=user_id)

        agg = qs.aggregate(
            total_orders=Count('id'),
            total_revenue=Sum('total_amount'),
            total_paid=Sum('amount_paid'),
            total_remaining=Sum('remaining_amount'),
            completed=Count('id', filter=Q(order_status='completed')),
            pending=Count('id', filter=Q(order_status='pending')),
            cancelled=Count('id', filter=Q(order_status='cancelled')),
        )

        orders = []
        for o in qs.prefetch_related('order_items__product').order_by('-created_at'):
            items = []
            for item in o.order_items.all():
                items.append({
                    'product_name': item.product.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                })
            orders.append({
                'id': o.id,
                'order_number': o.order_number,
                'sold_by': f"{o.user.first_name} {o.user.last_name}",
                'sold_by_business': o.user.business_name or '',
                'sold_by_id': o.user.id,
                'customer_name': f"{o.customer.first_name} {o.customer.last_name}",
                'customer_phone': o.customer.phone,
                'order_status': o.order_status,
                'payment_status': o.payment_status,
                'payment_method': o.payment_method,
                'subtotal': float(o.subtotal),
                'total_amount': float(o.total_amount),
                'amount_paid': float(o.amount_paid),
                'remaining_amount': float(o.remaining_amount),
                'notes': o.notes,
                'created_at': o.created_at,
                'items': items,
            })

        # Users who have placed POS orders — for filter dropdown
        users = list(
            UserMaster.objects
            .filter(pos_orders__isnull=False)
            .distinct()
            .values('id', 'first_name', 'last_name', 'business_name')
        )

        return Response({
            'summary': {
                'total_orders': agg['total_orders'] or 0,
                'total_revenue': float(agg['total_revenue'] or 0),
                'total_paid': float(agg['total_paid'] or 0),
                'total_remaining': float(agg['total_remaining'] or 0),
                'completed': agg['completed'] or 0,
                'pending': agg['pending'] or 0,
                'cancelled': agg['cancelled'] or 0,
            },
            'orders': orders,
            'users': users,
        })


class UserPurchaseReportView(APIView):
    """Logged-in user: their own stock purchase entries with optional date/vendor filter."""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-purchase-report"

    def get(self, request):
        qs = StockEntry.objects.filter(user=request.user)

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        vendor_id = request.query_params.get('vendor_id')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        if vendor_id:
            qs = qs.filter(vendor__id=vendor_id)

        agg = qs.aggregate(
            total_entries=Count('id'),
            total_qty=Sum('quantity'),
            total_purchase_cost=Sum('purchase_price'),
            total_cgst=Sum('cgst'),
            total_sgst=Sum('sgst'),
            total_labour=Sum('labour_cost'),
            total_transport=Sum('transporter_cost'),
            total_broker=Sum('broker_commission_amount'),
        )

        entries = []
        for e in qs.select_related('product', 'vendor', 'broker', 'transporter').order_by('-created_at'):
            entries.append({
                'id': e.id,
                'product_name': e.product.product_name,
                'product_sku': e.product.sku_code,
                'vendor': e.vendor.vendor_name,
                'vendor_id': e.vendor.id,
                'broker': e.broker.broker_name if e.broker else None,
                'transporter': e.transporter.transporter_name if e.transporter else None,
                'quantity': e.quantity,
                'purchase_price': float(e.purchase_price),
                'cgst_percentage': float(e.cgst_percentage or 0),
                'cgst': float(e.cgst or 0),
                'sgst_percentage': float(e.sgst_percentage or 0),
                'sgst': float(e.sgst or 0),
                'labour_cost': float(e.labour_cost or 0),
                'transporter_cost': float(e.transporter_cost or 0),
                'broker_commission': float(e.broker_commission_amount or 0),
                'manufacture_date': e.manufacture_date,
                'created_at': e.created_at,
            })

        # User's vendors for filter dropdown
        vendors = list(
            Vendor.objects
            .filter(stock_entries__user=request.user)
            .distinct()
            .order_by('vendor_name')
            .values('id', 'vendor_name')
        )

        return Response({
            'summary': {
                'total_entries': agg['total_entries'] or 0,
                'total_qty': agg['total_qty'] or 0,
                'total_purchase_cost': float(agg['total_purchase_cost'] or 0),
                'total_cgst': float(agg['total_cgst'] or 0),
                'total_sgst': float(agg['total_sgst'] or 0),
                'total_labour': float(agg['total_labour'] or 0),
                'total_transport': float(agg['total_transport'] or 0),
                'total_broker': float(agg['total_broker'] or 0),
            },
            'entries': entries,
            'vendors': vendors,
        })


class AdminPurchaseReportView(APIView):
    """Admin: all stock purchase entries across all users, with date/user/vendor filter."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = StockEntry.objects.select_related('user', 'product', 'vendor', 'broker', 'transporter').all()

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        user_id = request.query_params.get('user_id')
        vendor_id = request.query_params.get('vendor_id')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        if user_id:
            qs = qs.filter(user__id=user_id)
        if vendor_id:
            qs = qs.filter(vendor__id=vendor_id)

        agg = qs.aggregate(
            total_entries=Count('id'),
            total_qty=Sum('quantity'),
            total_purchase_cost=Sum('purchase_price'),
            total_cgst=Sum('cgst'),
            total_sgst=Sum('sgst'),
            total_labour=Sum('labour_cost'),
            total_transport=Sum('transporter_cost'),
            total_broker=Sum('broker_commission_amount'),
        )

        entries = []
        for e in qs.order_by('-created_at'):
            entries.append({
                'id': e.id,
                'added_by': f"{e.user.first_name} {e.user.last_name}",
                'added_by_id': e.user.id,
                'product_name': e.product.product_name,
                'product_sku': e.product.sku_code,
                'vendor': e.vendor.vendor_name,
                'vendor_id': e.vendor.id,
                'broker': e.broker.broker_name if e.broker else None,
                'transporter': e.transporter.transporter_name if e.transporter else None,
                'quantity': e.quantity,
                'purchase_price': float(e.purchase_price),
                'cgst_percentage': float(e.cgst_percentage or 0),
                'cgst': float(e.cgst or 0),
                'sgst_percentage': float(e.sgst_percentage or 0),
                'sgst': float(e.sgst or 0),
                'labour_cost': float(e.labour_cost or 0),
                'transporter_cost': float(e.transporter_cost or 0),
                'broker_commission': float(e.broker_commission_amount or 0),
                'manufacture_date': e.manufacture_date,
                'created_at': e.created_at,
            })

        # All vendors for filter dropdown
        vendors = list(
            Vendor.objects
            .filter(stock_entries__isnull=False)
            .distinct()
            .order_by('vendor_name')
            .values('id', 'vendor_name')
        )

        # All users who have added stock entries
        users = list(
            UserMaster.objects
            .filter(stock_entries__isnull=False)
            .distinct()
            .values('id', 'first_name', 'last_name', 'business_name')
        )

        return Response({
            'summary': {
                'total_entries': agg['total_entries'] or 0,
                'total_qty': agg['total_qty'] or 0,
                'total_purchase_cost': float(agg['total_purchase_cost'] or 0),
                'total_cgst': float(agg['total_cgst'] or 0),
                'total_sgst': float(agg['total_sgst'] or 0),
                'total_labour': float(agg['total_labour'] or 0),
                'total_transport': float(agg['total_transport'] or 0),
                'total_broker': float(agg['total_broker'] or 0),
            },
            'entries': entries,
            'vendors': vendors,
            'users': users,
        })


class UserBrokerReportView(APIView):
    """Logged-in user: their stock entries that involved a broker, with date/broker filter."""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-broker-report"

    def get(self, request):
        qs = StockEntry.objects.filter(user=request.user, broker__isnull=False)

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        broker_id = request.query_params.get('broker_id')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        if broker_id:
            qs = qs.filter(broker__id=broker_id)

        agg = qs.aggregate(
            total_entries=Count('id'),
            total_qty=Sum('quantity'),
            total_commission=Sum('broker_commission_amount'),
            total_purchase_cost=Sum('purchase_price'),
        )

        entries = []
        for e in qs.select_related('product', 'vendor', 'broker', 'transporter', 'vendor_invoice').order_by('-created_at'):
            entries.append({
                'id': e.id,
                'product_name': e.product.product_name,
                'product_sku': e.product.sku_code,
                'vendor': e.vendor.vendor_name,
                'broker_name': e.broker.broker_name,
                'broker_id': e.broker.id,
                'broker_phone': e.broker.phone_number,
                'transporter': e.transporter.transporter_name if e.transporter else None,
                'invoice_number': e.vendor_invoice.invoice_number if e.vendor_invoice else None,
                'quantity': e.quantity,
                'purchase_price': float(e.purchase_price),
                'broker_commission': float(e.broker_commission_amount or 0),
                'cgst_percentage': float(e.cgst_percentage or 0),
                'cgst': float(e.cgst or 0),
                'sgst_percentage': float(e.sgst_percentage or 0),
                'sgst': float(e.sgst or 0),
                'labour_cost': float(e.labour_cost or 0),
                'transporter_cost': float(e.transporter_cost or 0),
                'manufacture_date': e.manufacture_date,
                'created_at': e.created_at,
            })

        # All brokers this user has ever used
        brokers = list(
            Broker.objects
            .filter(stock_entries__user=request.user)
            .distinct()
            .order_by('broker_name')
            .values('id', 'broker_name', 'phone_number')
        )

        return Response({
            'summary': {
                'total_entries': agg['total_entries'] or 0,
                'total_qty': agg['total_qty'] or 0,
                'total_commission': float(agg['total_commission'] or 0),
                'total_purchase_cost': float(agg['total_purchase_cost'] or 0),
            },
            'entries': entries,
            'brokers': brokers,
        })


class AdminBrokerReportView(APIView):
    """Admin: all broker-involved stock entries across all users, with date/user/broker filter."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = StockEntry.objects.filter(broker__isnull=False).select_related(
            'user', 'product', 'vendor', 'broker', 'transporter', 'vendor_invoice'
        )

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        user_id = request.query_params.get('user_id')
        broker_id = request.query_params.get('broker_id')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        if user_id:
            qs = qs.filter(user__id=user_id)
        if broker_id:
            qs = qs.filter(broker__id=broker_id)

        agg = qs.aggregate(
            total_entries=Count('id'),
            total_qty=Sum('quantity'),
            total_commission=Sum('broker_commission_amount'),
            total_purchase_cost=Sum('purchase_price'),
        )

        entries = []
        for e in qs.order_by('-created_at'):
            entries.append({
                'id': e.id,
                'added_by': f"{e.user.first_name} {e.user.last_name}",
                'added_by_id': e.user.id,
                'product_name': e.product.product_name,
                'product_sku': e.product.sku_code,
                'vendor': e.vendor.vendor_name,
                'broker_name': e.broker.broker_name,
                'broker_id': e.broker.id,
                'broker_phone': e.broker.phone_number,
                'transporter': e.transporter.transporter_name if e.transporter else None,
                'invoice_number': e.vendor_invoice.invoice_number if e.vendor_invoice else None,
                'quantity': e.quantity,
                'purchase_price': float(e.purchase_price),
                'broker_commission': float(e.broker_commission_amount or 0),
                'cgst_percentage': float(e.cgst_percentage or 0),
                'cgst': float(e.cgst or 0),
                'sgst_percentage': float(e.sgst_percentage or 0),
                'sgst': float(e.sgst or 0),
                'labour_cost': float(e.labour_cost or 0),
                'transporter_cost': float(e.transporter_cost or 0),
                'manufacture_date': e.manufacture_date,
                'created_at': e.created_at,
            })

        # All brokers ever used across system
        brokers = list(
            Broker.objects
            .filter(stock_entries__isnull=False)
            .distinct()
            .order_by('broker_name')
            .values('id', 'broker_name', 'phone_number')
        )

        # All users who have used a broker
        users = list(
            UserMaster.objects
            .filter(stock_entries__broker__isnull=False)
            .distinct()
            .values('id', 'first_name', 'last_name', 'business_name')
        )

        return Response({
            'summary': {
                'total_entries': agg['total_entries'] or 0,
                'total_qty': agg['total_qty'] or 0,
                'total_commission': float(agg['total_commission'] or 0),
                'total_purchase_cost': float(agg['total_purchase_cost'] or 0),
            },
            'entries': entries,
            'brokers': brokers,
            'users': users,
        })


class UserFranchiseReportView(APIView):
    """Manager: stock they fulfilled and sold to franchise owners, grouped by order."""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-franchise-report"

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        shop_owner_id = request.query_params.get('shop_owner_id')

        # Get distinct orders where this manager fulfilled at least one item
        orders_qs = ShopOwnerOrders.objects.filter(
            order_items__fulfilled_by_manager=request.user,
            order_items__fulfilled_quantity__isnull=False,
        ).distinct().select_related('shop_owner').prefetch_related(
            'order_items__product'
        ).order_by('-created_at')

        if start_date:
            orders_qs = orders_qs.filter(created_at__date__gte=start_date)
        if end_date:
            orders_qs = orders_qs.filter(created_at__date__lte=end_date)
        if shop_owner_id:
            orders_qs = orders_qs.filter(shop_owner__id=shop_owner_id)

        total_qty = 0
        total_revenue = 0.0
        total_items = 0
        status_counts = {'completed': 0, 'pending': 0, 'cancelled': 0}
        orders = []

        for order in orders_qs:
            # Only items this manager fulfilled within this order
            my_items = [
                i for i in order.order_items.all()
                if i.fulfilled_by_manager_id == request.user.id
                and i.fulfilled_quantity is not None
            ]
            if not my_items:
                continue

            order_qty = sum(i.fulfilled_quantity or 0 for i in my_items)
            order_revenue = sum(
                float(i.actual_price or 0) * (i.fulfilled_quantity or 0)
                for i in my_items
            )
            total_qty += order_qty
            total_revenue += order_revenue
            total_items += len(my_items)

            if order.status in status_counts:
                status_counts[order.status] += 1

            items = []
            for i in my_items:
                line_total = float(i.actual_price or 0) * (i.fulfilled_quantity or 0)
                items.append({
                    'id': i.id,
                    'product_name': i.product.product_name,
                    'product_sku': i.product.sku_code,
                    'requested_quantity': i.requested_quantity,
                    'fulfilled_quantity': i.fulfilled_quantity,
                    'actual_price': float(i.actual_price or 0),
                    'line_total': line_total,
                })

            orders.append({
                'order_id': order.id,
                'order_number': order.order_number,
                'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}",
                'shop_owner_business': order.shop_owner.business_name or '',
                'shop_owner_id': order.shop_owner.id,
                'order_status': order.status,
                'payment_status': order.payment_status,
                'payment_method': order.payment_method,
                'amount_paid': float(order.amount_paid),
                'remaining_amount': float(order.remaining_amount),
                'total_qty': order_qty,
                'total_line_total': order_revenue,
                'order_date': order.created_at,
                'items': items,
            })

        franchises = list(
            UserMaster.objects
            .filter(shop_orders__order_items__fulfilled_by_manager=request.user)
            .distinct()
            .values('id', 'first_name', 'last_name', 'business_name')
        )

        return Response({
            'summary': {
                'total_orders': len(orders),
                'total_items': total_items,
                'total_qty': total_qty,
                'total_revenue': total_revenue,
                'completed': status_counts['completed'],
                'pending': status_counts['pending'],
                'cancelled': status_counts['cancelled'],
            },
            'orders': orders,
            'franchises': franchises,
        })


class AdminFranchiseReportView(APIView):
    """Admin: all franchise stock transactions system-wide, grouped by order."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        manager_id = request.query_params.get('manager_id')
        shop_owner_id = request.query_params.get('shop_owner_id')

        orders_qs = ShopOwnerOrders.objects.filter(
            order_items__fulfilled_quantity__isnull=False,
        ).distinct().select_related('shop_owner').prefetch_related(
            'order_items__product',
            'order_items__fulfilled_by_manager',
        ).order_by('-created_at')

        if start_date:
            orders_qs = orders_qs.filter(created_at__date__gte=start_date)
        if end_date:
            orders_qs = orders_qs.filter(created_at__date__lte=end_date)
        if shop_owner_id:
            orders_qs = orders_qs.filter(shop_owner__id=shop_owner_id)
        if manager_id:
            orders_qs = orders_qs.filter(order_items__fulfilled_by_manager__id=manager_id)

        total_qty = 0
        total_revenue = 0.0
        total_items = 0
        status_counts = {'completed': 0, 'pending': 0, 'cancelled': 0}
        orders = []

        for order in orders_qs:
            # All fulfilled items in this order (optionally scoped to one manager)
            fulfilled_items = [
                i for i in order.order_items.all()
                if i.fulfilled_quantity is not None
                and (not manager_id or (i.fulfilled_by_manager_id == int(manager_id)))
            ]
            if not fulfilled_items:
                continue

            order_qty = sum(i.fulfilled_quantity or 0 for i in fulfilled_items)
            order_revenue = sum(
                float(i.actual_price or 0) * (i.fulfilled_quantity or 0)
                for i in fulfilled_items
            )
            total_qty += order_qty
            total_revenue += order_revenue
            total_items += len(fulfilled_items)

            if order.status in status_counts:
                status_counts[order.status] += 1

            items = []
            for i in fulfilled_items:
                line_total = float(i.actual_price or 0) * (i.fulfilled_quantity or 0)
                items.append({
                    'id': i.id,
                    'product_name': i.product.product_name,
                    'product_sku': i.product.sku_code,
                    'fulfilled_by': f"{i.fulfilled_by_manager.first_name} {i.fulfilled_by_manager.last_name}" if i.fulfilled_by_manager else 'N/A',
                    'requested_quantity': i.requested_quantity,
                    'fulfilled_quantity': i.fulfilled_quantity,
                    'actual_price': float(i.actual_price or 0),
                    'line_total': line_total,
                })

            orders.append({
                'order_id': order.id,
                'order_number': order.order_number,
                'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}",
                'shop_owner_business': order.shop_owner.business_name or '',
                'shop_owner_id': order.shop_owner.id,
                'order_status': order.status,
                'payment_status': order.payment_status,
                'payment_method': order.payment_method,
                'amount_paid': float(order.amount_paid),
                'remaining_amount': float(order.remaining_amount),
                'total_qty': order_qty,
                'total_line_total': order_revenue,
                'order_date': order.created_at,
                'items': items,
            })

        managers = list(
            UserMaster.objects
            .filter(fulfilled_shop_orders__fulfilled_quantity__isnull=False)
            .distinct()
            .values('id', 'first_name', 'last_name', 'business_name')
        )

        franchises = list(
            UserMaster.objects
            .filter(shop_orders__order_items__fulfilled_quantity__isnull=False)
            .distinct()
            .values('id', 'first_name', 'last_name', 'business_name')
        )

        return Response({
            'summary': {
                'total_orders': len(orders),
                'total_items': total_items,
                'total_qty': total_qty,
                'total_revenue': total_revenue,
                'completed': status_counts['completed'],
                'pending': status_counts['pending'],
                'cancelled': status_counts['cancelled'],
            },
            'orders': orders,
            'managers': managers,
            'franchises': franchises,
        })
