from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404

from accounts.premissions import IsAdminRole
from accounts.models import UserMaster
from posorders.models import POSOrder
from customers.models import Customer
from shop.models import ShopOwnerOrders


class AllUsersWithRolesView(APIView):
    """Admin: list all users with their role and basic profile info."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        users = (
            UserMaster.objects
            .select_related('user_type')
            .order_by('user_type__role_name', 'first_name')
        )

        data = []
        for u in users:
            data.append({
                'id': u.id,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'email': u.email,
                'mobile_number': u.mobile_number,
                'business_name': u.business_name,
                'city': u.city,
                'state': u.state,
                'is_active': u.is_active,
                'last_login': u.last_login,
                'role_name': u.user_type.role_name if u.user_type else 'N/A',
                'user_image': str(u.user_image) if u.user_image else None,
            })

        return Response(data)


class UserDetailView(APIView):
    """Admin: full profile + activity stats for a single user."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, user_id):
        user = get_object_or_404(UserMaster.objects.select_related('user_type'), id=user_id)

        # ── Profile ────────────────────────────────────────────────────────────
        profile = {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'mobile_number': user.mobile_number,
            'business_name': user.business_name,
            'city': user.city,
            'state': user.state,
            'country': user.country,
            'postal_code': user.postal_code,
            'is_active': user.is_active,
            'last_login': user.last_login,
            'role_name': user.user_type.role_name if user.user_type else 'N/A',
            'user_image': str(user.user_image) if user.user_image else None,
        }

        # ── POS Activity ───────────────────────────────────────────────────────
        pos_qs = POSOrder.objects.filter(user=user)
        pos_agg = pos_qs.aggregate(
            total_orders=Count('id'),
            total_revenue=Sum('total_amount'),
            completed=Count('id', filter=Q(order_status='completed')),
            pending=Count('id', filter=Q(order_status='pending')),
            cancelled=Count('id', filter=Q(order_status='cancelled')),
        )

        recent_pos = []
        for o in pos_qs.select_related('customer').order_by('-created_at')[:10]:
            recent_pos.append({
                'id': o.id,
                'order_number': o.order_number,
                'customer_name': f"{o.customer.first_name} {o.customer.last_name}",
                'total_amount': float(o.total_amount),
                'order_status': o.order_status,
                'payment_status': o.payment_status,
                'created_at': o.created_at,
            })

        pos_data = {
            'total_orders': pos_agg['total_orders'] or 0,
            'total_revenue': float(pos_agg['total_revenue'] or 0),
            'completed': pos_agg['completed'] or 0,
            'pending': pos_agg['pending'] or 0,
            'cancelled': pos_agg['cancelled'] or 0,
            'recent_orders': recent_pos,
        }

        # ── Customers ──────────────────────────────────────────────────────────
        customer_qs = Customer.objects.filter(user=user)
        customers = []
        for c in customer_qs.order_by('-created_at')[:10]:
            customers.append({
                'id': c.id,
                'name': f"{c.first_name} {c.last_name}",
                'phone': c.phone,
                'city': c.city,
                'type_of_customer': c.type_of_customer,
                'created_at': c.created_at,
            })

        customer_data = {
            'total_customers': customer_qs.count(),
            'recent_customers': customers,
        }

        # ── Shop Activity (franchise owner) ────────────────────────────────────
        shop_qs = ShopOwnerOrders.objects.filter(shop_owner=user)
        shop_agg = shop_qs.aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_amount'),
            completed=Count('id', filter=Q(status='completed')),
            cancelled=Count('id', filter=Q(status='cancelled')),
        )

        recent_shop = []
        for o in shop_qs.order_by('-created_at')[:10]:
            recent_shop.append({
                'id': o.id,
                'order_number': o.order_number,
                'status': o.status,
                'total_amount': float(o.total_amount),
                'payment_status': o.payment_status,
                'created_at': o.created_at,
            })

        shop_data = {
            'total_orders': shop_agg['total_orders'] or 0,
            'total_spent': float(shop_agg['total_spent'] or 0),
            'completed': shop_agg['completed'] or 0,
            'cancelled': shop_agg['cancelled'] or 0,
            'recent_orders': recent_shop,
        }

        # ── Fulfilled Orders (manager) ─────────────────────────────────────────
        fulfilled_qs = ShopOwnerOrders.objects.filter(
            order_items__fulfilled_by_manager=user
        ).distinct()

        fulfilled_data = {
            'total_fulfilled': fulfilled_qs.count(),
            'completed': fulfilled_qs.filter(status='completed').count(),
        }

        return Response({
            'profile': profile,
            'pos': pos_data,
            'customers': customer_data,
            'shop_as_owner': shop_data,
            'shop_as_manager': fulfilled_data,
        })
