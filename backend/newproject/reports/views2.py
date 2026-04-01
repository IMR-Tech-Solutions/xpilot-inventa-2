from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, F, Q, DecimalField, ExpressionWrapper
from django.db.models.functions import TruncDate
from datetime import datetime, date
from django.utils.dateparse import parse_date
from django.utils import timezone
from collections import defaultdict

from accounts.models import UserMaster
from accounts.premissions import HasModuleAccess, IsAdminRole
from posorders.models import POSOrder, POSOrderItem
from inventory.models import StockEntry
from vendors.models import VendorInvoice
from customers.models import Customer
from shop.models import ShopOwnerOrders, ShopOrderItem


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def parse_date_param(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None

def apply_date_filter(qs, field, start_date, end_date):
    if start_date:
        qs = qs.filter(**{f'{field}__date__gte': start_date})
    if end_date:
        qs = qs.filter(**{f'{field}__date__lte': end_date})
    return qs

def fmt_date(d):
    if not d:
        return None
    if hasattr(d, 'strftime'):
        return d.strftime('%d-%m-%Y')
    return str(d)

def safe_float(v):
    try:
        return round(float(v), 2)
    except (TypeError, ValueError):
        return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# FIX 2 — NEW: Stock Ledger Summary
# One row per product. Shows total purchased, sold via POS, sold to shop owners,
# and current remaining balance (matches Manage Stock page exactly).
# Source:
#   Total Purchased  = sum(StockEntry.original_quantity) per product
#   Sold via POS     = sum(POSOrderItem.quantity) per product
#   Sold to Shop     = sum(ShopOrderItem.fulfilled_quantity) per product
#   Current Balance  = sum(StockEntry.quantity) — the live remaining field
# ─────────────────────────────────────────────────────────────────────────────

class StockLedgerSummaryView(APIView):
    """
    Stock Ledger Summary — one row per product showing the full stock picture:
    Total Purchased | Sold via POS | Sold to Shop Owners | Total Outward | Current Balance
    Current Balance matches the Remaining Quantity on the Manage Stock page.
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            # ── 1. Total purchased per product (sum of original_quantity) ────
            purchased = (
                StockEntry.objects.filter(user=request.user)
                .values('product_id', 'product__product_name', 'product__sku_code')
                .annotate(total_purchased=Sum('original_quantity'))
            )

            # ── 2. Current remaining per product (sum of live quantity) ──────
            remaining = (
                StockEntry.objects.filter(user=request.user, batch_status='active')
                .values('product_id')
                .annotate(current_balance=Sum('quantity'))
            )
            remaining_map = {r['product_id']: safe_float(r['current_balance']) for r in remaining}

            # ── 3. Sold via POS per product ──────────────────────────────────
            pos_sold = (
                POSOrderItem.objects.filter(
                    order__user=request.user,
                    order__order_status='completed'
                )
                .values('product_id')
                .annotate(pos_qty=Sum('quantity'))
            )
            pos_map = {r['product_id']: safe_float(r['pos_qty']) for r in pos_sold}

            # ── 4. Sold to shop owners per product ───────────────────────────
            shop_sold = (
                ShopOrderItem.objects.filter(
                    fulfilled_by_manager=request.user,
                    fulfilled_quantity__isnull=False,
                )
                .values('product_id')
                .annotate(shop_qty=Sum('fulfilled_quantity'))
            )
            shop_map = {r['product_id']: safe_float(r['shop_qty']) for r in shop_sold}

            # ── 5. Build rows ─────────────────────────────────────────────────
            rows = []
            for idx, p in enumerate(purchased, 1):
                pid            = p['product_id']
                total_purch    = safe_float(p['total_purchased'])
                pos_qty        = pos_map.get(pid, 0.0)
                shop_qty       = shop_map.get(pid, 0.0)
                total_outward  = round(pos_qty + shop_qty, 2)
                current_bal    = remaining_map.get(pid, 0.0)

                rows.append({
                    'sr_no':           idx,
                    'product_name':    p['product__product_name'],
                    'product_code':    p['product__sku_code'] or 'N/A',
                    'total_purchased': total_purch,
                    'sold_pos':        pos_qty,
                    'sold_shop':       shop_qty,
                    'total_outward':   total_outward,
                    'current_balance': current_bal,
                    # Sanity check: purchased - outward should ≈ current_balance
                    # Small difference can occur if batch_status is not 'active'
                    # (e.g. damaged/sold/expired batches with leftover qty)
                })

            summary = {
                'total_products':      len(rows),
                'total_purchased':     round(sum(r['total_purchased'] for r in rows), 2),
                'total_sold_pos':      round(sum(r['sold_pos']        for r in rows), 2),
                'total_sold_shop':     round(sum(r['sold_shop']       for r in rows), 2),
                'total_outward':       round(sum(r['total_outward']   for r in rows), 2),
                'total_balance':       round(sum(r['current_balance'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report':  'Stock Ledger Summary',
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminStockLedgerSummaryView(APIView):
    """Admin version — filter by user_id to see any manager's stock ledger."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            user_id = request.GET.get('user_id')

            purchased_qs = StockEntry.objects.all()
            if user_id:
                purchased_qs = purchased_qs.filter(user_id=user_id)

            purchased = (
                purchased_qs
                .values('product_id', 'product__product_name', 'product__sku_code', 'user_id', 'user__first_name', 'user__last_name')
                .annotate(total_purchased=Sum('original_quantity'))
            )

            remaining_qs = StockEntry.objects.filter(batch_status='active')
            if user_id:
                remaining_qs = remaining_qs.filter(user_id=user_id)
            remaining = remaining_qs.values('product_id', 'user_id').annotate(current_balance=Sum('quantity'))
            remaining_map = {(r['product_id'], r['user_id']): safe_float(r['current_balance']) for r in remaining}

            pos_qs = POSOrderItem.objects.filter(order__order_status='completed')
            if user_id:
                pos_qs = pos_qs.filter(order__user_id=user_id)
            pos_sold = pos_qs.values('product_id', 'order__user_id').annotate(pos_qty=Sum('quantity'))
            pos_map  = {(r['product_id'], r['order__user_id']): safe_float(r['pos_qty']) for r in pos_sold}

            shop_qs = ShopOrderItem.objects.filter(fulfilled_quantity__isnull=False)
            if user_id:
                shop_qs = shop_qs.filter(fulfilled_by_manager_id=user_id)
            shop_sold = shop_qs.values('product_id', 'fulfilled_by_manager_id').annotate(shop_qty=Sum('fulfilled_quantity'))
            shop_map  = {(r['product_id'], r['fulfilled_by_manager_id']): safe_float(r['shop_qty']) for r in shop_sold}

            rows = []
            for idx, p in enumerate(purchased, 1):
                pid         = p['product_id']
                uid         = p['user_id']
                total_purch = safe_float(p['total_purchased'])
                pos_qty     = pos_map.get((pid, uid), 0.0)
                shop_qty    = shop_map.get((pid, uid), 0.0)
                total_out   = round(pos_qty + shop_qty, 2)
                current_bal = remaining_map.get((pid, uid), 0.0)

                rows.append({
                    'sr_no':           idx,
                    'product_name':    p['product__product_name'],
                    'product_code':    p['product__sku_code'] or 'N/A',
                    'user_name':       f"{p['user__first_name']} {p['user__last_name']}".strip(),
                    'total_purchased': total_purch,
                    'sold_pos':        pos_qty,
                    'sold_shop':       shop_qty,
                    'total_outward':   total_out,
                    'current_balance': current_bal,
                })

            summary = {
                'total_products':  len(rows),
                'total_purchased': round(sum(r['total_purchased'] for r in rows), 2),
                'total_sold_pos':  round(sum(r['sold_pos']        for r in rows), 2),
                'total_sold_shop': round(sum(r['sold_shop']       for r in rows), 2),
                'total_outward':   round(sum(r['total_outward']   for r in rows), 2),
                'total_balance':   round(sum(r['current_balance'] for r in rows), 2),
            }

            return Response({
                'success':          True,
                'report':           'Stock Ledger Summary (Admin)',
                'filtered_user_id': user_id,
                'summary':          summary,
                'rows':             rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)