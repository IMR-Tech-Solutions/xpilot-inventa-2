from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404

from accounts.premissions import IsAdminRole
from accounts.models import UserMaster
from posorders.models import POSOrder, POSOrderItem
from customers.models import Customer
from shop.models import ShopOwnerOrders, ShopOrderItem, ShopOwnerProducts
from inventory.models import StockEntry
from products.models import Product


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


# ── Stock Management Views ──────────────────────────────────────────────────────

class AllStockManagementView(APIView):
    """Admin: all products with stock added, sold via POS, sent to franchise, remaining."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        products = (
            Product.objects
            .select_related('category', 'unit')
            .filter(is_active=True)
            .order_by('category__category_name', 'product_name')
        )

        data = []
        for p in products:
            total_added = (
                StockEntry.objects.filter(product=p)
                .aggregate(total=Sum('quantity'))['total'] or 0
            )
            sold_via_pos = (
                POSOrderItem.objects.filter(
                    product=p,
                    order__order_status__in=['completed', 'confirmed', 'processing', 'ready']
                ).aggregate(total=Sum('quantity'))['total'] or 0
            )
            sent_to_franchise = (
                ShopOrderItem.objects.filter(
                    product=p,
                    fulfilled_quantity__isnull=False
                ).aggregate(total=Sum('fulfilled_quantity'))['total'] or 0
            )

            data.append({
                'id': p.id,
                'product_name': p.product_name,
                'sku_code': p.sku_code,
                'product_image': str(p.product_image) if p.product_image else None,
                'category': p.category.category_name if p.category else 'N/A',
                'unit': p.unit.unitName if p.unit else 'N/A',
                'selling_price': float(p.selling_price) if p.selling_price else None,
                'current_stock': p.current_stock,
                'low_stock_threshold': p.low_stock_threshold,
                'total_added': total_added,
                'sold_via_pos': sold_via_pos,
                'sent_to_franchise': sent_to_franchise,
            })

        return Response(data)


class ProductStockDetailView(APIView):
    """Admin: full stock movement detail for a single product."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, product_id):
        product = get_object_or_404(
            Product.objects.select_related('category', 'unit'),
            id=product_id
        )

        # ── Product info ───────────────────────────────────────────────────────
        product_info = {
            'id': product.id,
            'product_name': product.product_name,
            'sku_code': product.sku_code,
            'product_image': str(product.product_image) if product.product_image else None,
            'category': product.category.category_name if product.category else 'N/A',
            'unit': product.unit.unitName if product.unit else 'N/A',
            'selling_price': float(product.selling_price) if product.selling_price else None,
            'current_stock': product.current_stock,
            'low_stock_threshold': product.low_stock_threshold,
        }

        # ── Stock Entries ──────────────────────────────────────────────────────
        stock_entries = []
        for entry in StockEntry.objects.filter(product=product).select_related(
            'vendor', 'broker', 'transporter', 'user'
        ).order_by('-created_at'):
            stock_entries.append({
                'id': entry.id,
                'quantity': entry.quantity,
                'purchase_price': float(entry.purchase_price),
                'cgst_percentage': float(entry.cgst_percentage or 0),
                'cgst': float(entry.cgst or 0),
                'sgst_percentage': float(entry.sgst_percentage or 0),
                'sgst': float(entry.sgst or 0),
                'labour_cost': float(entry.labour_cost or 0),
                'transporter_cost': float(entry.transporter_cost or 0),
                'broker_commission': float(entry.broker_commission_amount or 0),
                'vendor': entry.vendor.vendor_name if entry.vendor else 'N/A',
                'broker': entry.broker.broker_name if entry.broker else None,
                'transporter': entry.transporter.transporter_name if entry.transporter else None,
                'added_by': f"{entry.user.first_name} {entry.user.last_name}" if entry.user else 'N/A',
                'manufacture_date': entry.manufacture_date,
                'created_at': entry.created_at,
            })

        # ── POS Sales ─────────────────────────────────────────────────────────
        pos_sales = []
        for item in POSOrderItem.objects.filter(product=product).select_related(
            'order__customer', 'order__user'
        ).order_by('-order__created_at'):
            pos_sales.append({
                'id': item.id,
                'order_number': item.order.order_number,
                'customer_name': f"{item.order.customer.first_name} {item.order.customer.last_name}",
                'sold_by': f"{item.order.user.first_name} {item.order.user.last_name}",
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total_price': float(item.total_price),
                'order_status': item.order.order_status,
                'payment_status': item.order.payment_status,
                'created_at': item.order.created_at,
            })

        # ── Franchise Activity ─────────────────────────────────────────────────
        franchise_activity = []
        for item in ShopOrderItem.objects.filter(
            product=product,
            fulfilled_quantity__isnull=False
        ).select_related(
            'order__shop_owner', 'fulfilled_by_manager'
        ).order_by('-order__created_at'):
            # Get the shop owner's current selling price for this product
            shop_owner_product = ShopOwnerProducts.objects.filter(
                shop_owner=item.order.shop_owner,
                product=product
            ).first()

            franchise_activity.append({
                'id': item.id,
                'order_number': item.order.order_number,
                'shop_owner': f"{item.order.shop_owner.first_name} {item.order.shop_owner.last_name}",
                'shop_owner_business': item.order.shop_owner.business_name,
                'fulfilled_by': f"{item.fulfilled_by_manager.first_name} {item.fulfilled_by_manager.last_name}" if item.fulfilled_by_manager else 'N/A',
                'fulfilled_quantity': item.fulfilled_quantity,
                'manager_selling_price': float(item.actual_price) if item.actual_price else None,
                'franchise_selling_price': float(shop_owner_product.selling_price) if shop_owner_product else None,
                'order_status': item.order.status,
                'payment_status': item.order.payment_status,
                'created_at': item.order.created_at,
            })

        return Response({
            'product': product_info,
            'stock_entries': stock_entries,
            'pos_sales': pos_sales,
            'franchise_activity': franchise_activity,
        })
