from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q

from accounts.premissions import IsAdminRole, HasModuleAccess
from accounts.models import UserMaster
from posorders.models import POSOrder


class UserSalesReportView(APIView):
    """Logged-in user: their own POS sales report with optional date range filter."""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-sales-report"

    def get(self, request):
        qs = POSOrder.objects.filter(user=request.user)

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)

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
