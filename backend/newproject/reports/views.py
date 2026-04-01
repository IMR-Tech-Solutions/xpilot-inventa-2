from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, F, Q, DecimalField, ExpressionWrapper
from django.db.models.functions import TruncDate
from datetime import datetime, date
from django.utils.dateparse import parse_date
from django.utils import timezone

from accounts.models import UserMaster
from accounts.premissions import HasModuleAccess, IsAdminRole
from posorders.models import POSOrder, POSOrderItem
from inventory.models import StockEntry
from vendors.models import VendorInvoice
from customers.models import Customer


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
# 1. Sales Register
# Who: Distributor (current user)
# Source: posorders_posorder  +  posorders_posorderitem  +  customers_customer
# ─────────────────────────────────────────────────────────────────────────────

class SalesRegisterView(APIView):
    """
    Sales Register — one row per POS invoice.
    Columns: Sr No, Date, Invoice No, Party Name, Location,
             Basic Amount, Tax Amount, Round Off, Total Invoice Amount
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))

            orders = POSOrder.objects.filter(
                user=request.user
            ).select_related('customer').order_by('created_at')

            orders = apply_date_filter(orders, 'created_at', start_date, end_date)

            rows = []
            for idx, o in enumerate(orders, 1):
                basic_amount  = safe_float(o.subtotal)
                tax_amount    = safe_float(o.tax_amount)
                total_amount  = safe_float(o.total_amount)
                round_off     = round(round(total_amount) - total_amount, 2)

                customer_name = 'Walk-in'
                location      = ''
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()
                    location      = o.customer.city or ''

                rows.append({
                    'sr_no':          idx,
                    'date':           fmt_date(o.created_at),
                    'invoice_no':     o.order_number,
                    'party_name':     customer_name,
                    'location':       location,
                    'basic_amount':   basic_amount,
                    'tax_amount':     tax_amount,
                    'round_off':      round_off,
                    'total_amount':   total_amount,
                })

            summary = {
                'total_invoices':   len(rows),
                'total_basic':      round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':        round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':     round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Sales Register',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminSalesRegisterView(APIView):
    """Admin version — can filter by user_id."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            user_id    = request.GET.get('user_id')

            orders = POSOrder.objects.select_related('customer', 'user').order_by('created_at')
            if user_id:
                orders = orders.filter(user_id=user_id)
            orders = apply_date_filter(orders, 'created_at', start_date, end_date)

            rows = []
            for idx, o in enumerate(orders, 1):
                basic_amount = safe_float(o.subtotal)
                tax_amount   = safe_float(o.tax_amount)
                total_amount = safe_float(o.total_amount)
                round_off    = round(round(total_amount) - total_amount, 2)

                customer_name = 'Walk-in'
                location      = ''
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()
                    location      = o.customer.city or ''

                rows.append({
                    'sr_no':          idx,
                    'date':           fmt_date(o.created_at),
                    'invoice_no':     o.order_number,
                    'party_name':     customer_name,
                    'location':       location,
                    'user_name':      f"{o.user.first_name} {o.user.last_name}".strip(),
                    'basic_amount':   basic_amount,
                    'tax_amount':     tax_amount,
                    'round_off':      round_off,
                    'total_amount':   total_amount,
                })

            summary = {
                'total_invoices': len(rows),
                'total_basic':    round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':      round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':   round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Sales Register (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_user_id': user_id,
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Product Wise Sales Register
# Source: posorders_posorderitem → posorders_posorder → customers_customer
# ─────────────────────────────────────────────────────────────────────────────

class ProductWiseSalesRegisterView(APIView):
    """
    Product Wise Sales Register — one row per order item.
    Columns: Sr No, Date, Invoice No, Party Name, Product Code, Product Name,
             Qty, Unit, Rate, Basic Amount, Tax Amount, Round Off, Total Invoice Amount
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date  = parse_date_param(request.GET.get('start_date'))
            end_date    = parse_date_param(request.GET.get('end_date'))
            product_id  = request.GET.get('product_id')

            items = POSOrderItem.objects.filter(
                order__user=request.user
            ).select_related('order__customer', 'product', 'product__unit').order_by(
                'order__created_at'
            )

            items = apply_date_filter(items, 'order__created_at', start_date, end_date)
            if product_id:
                items = items.filter(product_id=product_id)

            rows = []
            for idx, item in enumerate(items, 1):
                o            = item.order
                qty          = safe_float(item.quantity)
                rate         = safe_float(item.unit_price)
                basic_amount = round(qty * rate, 2)
                # per-item tax is proportional share of order tax
                order_total  = safe_float(o.subtotal)
                item_tax = 0.0
                if order_total > 0:
                    item_tax = round(safe_float(o.tax_amount) * (basic_amount / order_total), 2)
                total_item   = round(basic_amount + item_tax, 2)
                round_off    = round(round(total_item) - total_item, 2)

                customer_name = 'Walk-in'
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()

                unit_name = ''
                if hasattr(item.product, 'unit') and item.product.unit:
                    unit_name = item.product.unit.unit_name if hasattr(item.product.unit, 'unit_name') else str(item.product.unit)

                rows.append({
                    'sr_no':         idx,
                    'date':          fmt_date(o.created_at),
                    'invoice_no':    o.order_number,
                    'party_name':    customer_name,
                    'product_code':  item.product.sku_code or 'N/A',
                    'product_name':  item.product.product_name,
                    'qty':           qty,
                    'unit':          unit_name,
                    'rate':          rate,
                    'basic_amount':  basic_amount,
                    'tax_amount':    item_tax,
                    'round_off':     round_off,
                    'total_amount':  total_item,
                })

            summary = {
                'total_line_items': len(rows),
                'total_qty':        round(sum(r['qty']          for r in rows), 2),
                'total_basic':      round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':        round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':     round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Product Wise Sales Register',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminProductWiseSalesRegisterView(APIView):
    """Admin version — can filter by user_id and product_id."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            user_id    = request.GET.get('user_id')
            product_id = request.GET.get('product_id')

            items = POSOrderItem.objects.select_related(
                'order__customer', 'order__user', 'product', 'product__unit'
            ).order_by('order__created_at')

            if user_id:
                items = items.filter(order__user_id=user_id)
            if product_id:
                items = items.filter(product_id=product_id)
            items = apply_date_filter(items, 'order__created_at', start_date, end_date)

            rows = []
            for idx, item in enumerate(items, 1):
                o            = item.order
                qty          = safe_float(item.quantity)
                rate         = safe_float(item.unit_price)
                basic_amount = round(qty * rate, 2)
                order_total  = safe_float(o.subtotal)
                item_tax = 0.0
                if order_total > 0:
                    item_tax = round(safe_float(o.tax_amount) * (basic_amount / order_total), 2)
                total_item = round(basic_amount + item_tax, 2)
                round_off  = round(round(total_item) - total_item, 2)

                customer_name = 'Walk-in'
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()

                unit_name = ''
                if hasattr(item.product, 'unit') and item.product.unit:
                    unit_name = item.product.unit.unit_name if hasattr(item.product.unit, 'unit_name') else str(item.product.unit)

                rows.append({
                    'sr_no':         idx,
                    'date':          fmt_date(o.created_at),
                    'invoice_no':    o.order_number,
                    'party_name':    customer_name,
                    'user_name':     f"{o.user.first_name} {o.user.last_name}".strip(),
                    'product_code':  item.product.sku_code or 'N/A',
                    'product_name':  item.product.product_name,
                    'qty':           qty,
                    'unit':          unit_name,
                    'rate':          rate,
                    'basic_amount':  basic_amount,
                    'tax_amount':    item_tax,
                    'round_off':     round_off,
                    'total_amount':  total_item,
                })

            summary = {
                'total_line_items': len(rows),
                'total_qty':        round(sum(r['qty']          for r in rows), 2),
                'total_basic':      round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':        round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':     round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Product Wise Sales Register (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_user_id': user_id,
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Purchase Register
# Source: vendors_vendorinvoice → vendors_vendor
# ─────────────────────────────────────────────────────────────────────────────

class PurchaseRegisterView(APIView):
    """
    Purchase Register — one row per vendor invoice.
    Columns: Sr No, GRN Date, Invoice Date, Invoice No, Vendor Name,
             Basic Amount, Tax Amount, Round Off, Total Invoice Amount
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            vendor_id  = request.GET.get('vendor_id')

            invoices = VendorInvoice.objects.filter(
                user=request.user
            ).select_related('vendor').order_by('created_at')

            invoices = apply_date_filter(invoices, 'created_at', start_date, end_date)
            if vendor_id:
                invoices = invoices.filter(vendor_id=vendor_id)

            rows = []
            for idx, inv in enumerate(invoices, 1):
                # Get all batches in this invoice to compute totals
                batches = inv.stock_batches.all()
                basic_amount = safe_float(
                    batches.aggregate(
                        t=Sum(F('original_quantity') * F('purchase_price'))
                    )['t']
                )
                tax_amount = safe_float(
                    batches.aggregate(t=Sum('tax_amount'))['t']
                )
                total_amount = round(basic_amount + tax_amount, 2)
                round_off    = round(round(total_amount) - total_amount, 2)

                rows.append({
                    'sr_no':         idx,
                    'grn_date':      fmt_date(inv.created_at),
                    'invoice_date':  fmt_date(inv.invoice_date) if hasattr(inv, 'invoice_date') else fmt_date(inv.created_at),
                    'invoice_no':    inv.invoice_number,
                    'vendor_name':   inv.vendor.vendor_name,
                    'basic_amount':  basic_amount,
                    'tax_amount':    tax_amount,
                    'round_off':     round_off,
                    'total_amount':  total_amount,
                })

            summary = {
                'total_invoices': len(rows),
                'total_basic':    round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':      round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':   round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Purchase Register',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminPurchaseRegisterView(APIView):
    """Admin version — can filter by user_id."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            user_id    = request.GET.get('user_id')
            vendor_id  = request.GET.get('vendor_id')

            invoices = VendorInvoice.objects.select_related('vendor', 'user').order_by('created_at')
            if user_id:
                invoices = invoices.filter(user_id=user_id)
            if vendor_id:
                invoices = invoices.filter(vendor_id=vendor_id)
            invoices = apply_date_filter(invoices, 'created_at', start_date, end_date)

            rows = []
            for idx, inv in enumerate(invoices, 1):
                batches      = inv.stock_batches.all()
                basic_amount = safe_float(
                    batches.aggregate(t=Sum(F('original_quantity') * F('purchase_price')))['t']
                )
                tax_amount   = safe_float(batches.aggregate(t=Sum('tax_amount'))['t'])
                total_amount = round(basic_amount + tax_amount, 2)
                round_off    = round(round(total_amount) - total_amount, 2)

                rows.append({
                    'sr_no':         idx,
                    'grn_date':      fmt_date(inv.created_at),
                    'invoice_date':  fmt_date(inv.invoice_date) if hasattr(inv, 'invoice_date') else fmt_date(inv.created_at),
                    'invoice_no':    inv.invoice_number,
                    'vendor_name':   inv.vendor.vendor_name,
                    'user_name':     f"{inv.user.first_name} {inv.user.last_name}".strip(),
                    'basic_amount':  basic_amount,
                    'tax_amount':    tax_amount,
                    'round_off':     round_off,
                    'total_amount':  total_amount,
                })

            summary = {
                'total_invoices': len(rows),
                'total_basic':    round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':      round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':   round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Purchase Register (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_user_id': user_id,
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Product Wise Purchase Register
# Source: inventory_stockbatch → vendors_vendorinvoice → products_product
# ─────────────────────────────────────────────────────────────────────────────

class ProductWisePurchaseRegisterView(APIView):
    """
    Product Wise Purchase Register — one row per stock batch.
    Columns: Sr No, Date, Invoice No, Vendor Name, Product Code, Product Name,
             Qty, Unit, Rate, Basic Amount, Tax Amount, Round Off, Total Invoice Amount
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            vendor_id  = request.GET.get('vendor_id')
            product_id = request.GET.get('product_id')

            batches = StockEntry.objects.filter(
                user=request.user
            ).select_related(
                'product', 'vendor', 'vendor_invoice', 'product__unit'
            ).order_by('created_at')

            batches = apply_date_filter(batches, 'created_at', start_date, end_date)
            if vendor_id:
                batches = batches.filter(vendor_id=vendor_id)
            if product_id:
                batches = batches.filter(product_id=product_id)

            rows = []
            for idx, b in enumerate(batches, 1):
                qty          = safe_float(b.original_quantity)
                rate         = safe_float(b.purchase_price)
                basic_amount = round(qty * rate, 2)
                tax_amount   = safe_float(b.tax_amount)
                total_amount = round(basic_amount + tax_amount, 2)
                round_off    = round(round(total_amount) - total_amount, 2)

                invoice_no = 'N/A'
                if b.vendor_invoice:
                    invoice_no = b.vendor_invoice.invoice_number

                unit_name = ''
                if hasattr(b.product, 'unit') and b.product.unit:
                    unit_name = b.product.unit.unit_name if hasattr(b.product.unit, 'unit_name') else str(b.product.unit)

                rows.append({
                    'sr_no':         idx,
                    'date':          fmt_date(b.created_at),
                    'invoice_no':    invoice_no,
                    'vendor_name':   b.vendor.vendor_name if b.vendor else 'N/A',
                    'product_code':  b.product.sku_code or 'N/A',
                    'product_name':  b.product.product_name,
                    'qty':           qty,
                    'unit':          unit_name,
                    'rate':          rate,
                    'basic_amount':  basic_amount,
                    'tax_amount':    tax_amount,
                    'round_off':     round_off,
                    'total_amount':  total_amount,
                    'reference_no':  b.reference_number or 'N/A',
                    'mfg_date':      fmt_date(b.manufacture_date),
                    'exp_date':      fmt_date(b.expiry_date),
                })

            summary = {
                'total_batches': len(rows),
                'total_qty':     round(sum(r['qty']          for r in rows), 2),
                'total_basic':   round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':     round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':  round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Product Wise Purchase Register',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminProductWisePurchaseRegisterView(APIView):
    """Admin version."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            user_id    = request.GET.get('user_id')
            vendor_id  = request.GET.get('vendor_id')
            product_id = request.GET.get('product_id')

            batches = StockEntry.objects.select_related(
                'product', 'vendor', 'vendor_invoice', 'user', 'product__unit'
            ).order_by('created_at')

            if user_id:
                batches = batches.filter(user_id=user_id)
            if vendor_id:
                batches = batches.filter(vendor_id=vendor_id)
            if product_id:
                batches = batches.filter(product_id=product_id)
            batches = apply_date_filter(batches, 'created_at', start_date, end_date)

            rows = []
            for idx, b in enumerate(batches, 1):
                qty          = safe_float(b.original_quantity)
                rate         = safe_float(b.purchase_price)
                basic_amount = round(qty * rate, 2)
                tax_amount   = safe_float(b.tax_amount)
                total_amount = round(basic_amount + tax_amount, 2)
                round_off    = round(round(total_amount) - total_amount, 2)

                invoice_no = 'N/A'
                if b.vendor_invoice:
                    invoice_no = b.vendor_invoice.invoice_number

                unit_name = ''
                if hasattr(b.product, 'unit') and b.product.unit:
                    unit_name = b.product.unit.unit_name if hasattr(b.product.unit, 'unit_name') else str(b.product.unit)

                rows.append({
                    'sr_no':         idx,
                    'date':          fmt_date(b.created_at),
                    'invoice_no':    invoice_no,
                    'vendor_name':   b.vendor.vendor_name if b.vendor else 'N/A',
                    'user_name':     f"{b.user.first_name} {b.user.last_name}".strip(),
                    'product_code':  b.product.sku_code or 'N/A',
                    'product_name':  b.product.product_name,
                    'qty':           qty,
                    'unit':          unit_name,
                    'rate':          rate,
                    'basic_amount':  basic_amount,
                    'tax_amount':    tax_amount,
                    'round_off':     round_off,
                    'total_amount':  total_amount,
                    'reference_no':  b.reference_number or 'N/A',
                    'mfg_date':      fmt_date(b.manufacture_date),
                    'exp_date':      fmt_date(b.expiry_date),
                })

            summary = {
                'total_batches': len(rows),
                'total_qty':     round(sum(r['qty']          for r in rows), 2),
                'total_basic':   round(sum(r['basic_amount'] for r in rows), 2),
                'total_tax':     round(sum(r['tax_amount']   for r in rows), 2),
                'total_amount':  round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Product Wise Purchase Register (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_user_id': user_id,
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Inventory Report
# FIX 1: vendor_invoice instead of purchase_invoice
# FIX 2: ShopOrderItem fulfillments added as outward transactions (type='Shop Sale')
# ─────────────────────────────────────────────────────────────────────────────

def _build_inventory_rows(inward_qs, pos_outward_qs, shop_outward_qs, product_id=None):
    """
    Shared helper — merges inward (purchases), POS outward, and shop outward
    into a single chronologically sorted transaction list with running closing balance.
    """
    # ── Inward: stock purchases ──────────────────────────────────────────────
    inward_txns = []
    for b in inward_qs:
        invoice_no = b.vendor_invoice.invoice_number if b.vendor_invoice else 'N/A'  # ← FIXED
        inward_txns.append({
            'date':         b.created_at.date(),
            'product_id':   b.product_id,
            'product_name': b.product.product_name,
            'type':         'Purchase',
            'voucher_no':   invoice_no,
            'in_qty':       safe_float(b.original_quantity),
            'in_rate':      safe_float(b.purchase_price),
            'in_amount':    round(safe_float(b.original_quantity) * safe_float(b.purchase_price), 2),
            'out_qty':      0.0, 'out_rate': 0.0, 'out_amount': 0.0,
        })

    # ── Outward: POS sales ───────────────────────────────────────────────────
    pos_txns = []
    for item in pos_outward_qs:
        pos_txns.append({
            'date':         item.order.created_at.date(),
            'product_id':   item.product_id,
            'product_name': item.product.product_name,
            'type':         'POS Sale',
            'voucher_no':   item.order.order_number,
            'in_qty':       0.0, 'in_rate': 0.0, 'in_amount': 0.0,
            'out_qty':      safe_float(item.quantity),
            'out_rate':     safe_float(item.unit_price),
            'out_amount':   round(safe_float(item.quantity) * safe_float(item.unit_price), 2),
        })

    # ── Outward: Shop order fulfillments ─────────────────────────────────────
    shop_txns = []
    for item in shop_outward_qs:
        shop_txns.append({
            'date':         item.order.created_at.date(),
            'product_id':   item.product_id,
            'product_name': item.product.product_name,
            'type':         'Shop Sale',
            'voucher_no':   item.order.order_number,
            'in_qty':       0.0, 'in_rate': 0.0, 'in_amount': 0.0,
            'out_qty':      safe_float(item.fulfilled_quantity),
            'out_rate':     safe_float(item.actual_price),
            'out_amount':   round(safe_float(item.fulfilled_quantity) * safe_float(item.actual_price), 2),
        })

    # ── Merge & sort chronologically ─────────────────────────────────────────
    all_txns = sorted(inward_txns + pos_txns + shop_txns, key=lambda x: x['date'])

    closing_qty_map = {}
    rows = []
    for idx, txn in enumerate(all_txns, 1):
        pid = txn['product_id']
        closing_qty_map.setdefault(pid, 0.0)
        closing_qty_map[pid] += txn['in_qty'] - txn['out_qty']
        closing_qty  = closing_qty_map[pid]
        closing_rate = txn['in_rate'] if txn['in_qty'] > 0 else txn['out_rate']
        rows.append({
            'sr_no':          idx,
            'date':           fmt_date(txn['date']),
            'product_name':   txn['product_name'],
            'type':           txn['type'],
            'voucher_no':     txn['voucher_no'],
            'in_qty':         txn['in_qty'],
            'in_rate':        txn['in_rate'],
            'in_amount':      txn['in_amount'],
            'out_qty':        txn['out_qty'],
            'out_rate':       txn['out_rate'],
            'out_amount':     txn['out_amount'],
            'closing_qty':    closing_qty,
            'closing_rate':   closing_rate,
            'closing_amount': round(closing_qty * closing_rate, 2),
        })
    return rows


class InventoryReportView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            product_id = request.GET.get('product_id')

            inward_qs = StockEntry.objects.filter(
                user=request.user
            ).select_related('product', 'vendor_invoice')  # ← FIXED
            inward_qs = apply_date_filter(inward_qs, 'created_at', start_date, end_date)
            if product_id:
                inward_qs = inward_qs.filter(product_id=product_id)

            pos_qs = POSOrderItem.objects.filter(
                order__user=request.user,
                order__order_status='completed'
            ).select_related('product', 'order')
            pos_qs = apply_date_filter(pos_qs, 'order__created_at', start_date, end_date)
            if product_id:
                pos_qs = pos_qs.filter(product_id=product_id)

            # ── NEW: shop order fulfillments as outward ──────────────────────
            shop_qs = ShopOrderItem.objects.filter(
                fulfilled_by_manager=request.user,
                fulfilled_quantity__isnull=False,
                actual_price__isnull=False,
            ).select_related('product', 'order')
            shop_qs = apply_date_filter(shop_qs, 'order__created_at', start_date, end_date)
            if product_id:
                shop_qs = shop_qs.filter(product_id=product_id)

            rows = _build_inventory_rows(inward_qs, pos_qs, shop_qs)

            summary = {
                'total_transactions':  len(rows),
                'total_inward_qty':    round(sum(r['in_qty']     for r in rows), 2),
                'total_inward_value':  round(sum(r['in_amount']  for r in rows), 2),
                'total_outward_qty':   round(sum(r['out_qty']    for r in rows), 2),
                'total_outward_value': round(sum(r['out_amount'] for r in rows), 2),
                'pos_outward_qty':     round(sum(r['out_qty'] for r in rows if r['type'] == 'POS Sale'), 2),
                'shop_outward_qty':    round(sum(r['out_qty'] for r in rows if r['type'] == 'Shop Sale'), 2),
            }

            return Response({'success': True, 'report': 'Inventory Report',
                'date_range': {'start_date': fmt_date(start_date), 'end_date': fmt_date(end_date)},
                'summary': summary, 'rows': rows})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminInventoryReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            user_id    = request.GET.get('user_id')
            product_id = request.GET.get('product_id')

            inward_qs = StockEntry.objects.select_related('product', 'vendor_invoice', 'user')  # ← FIXED
            if user_id:
                inward_qs = inward_qs.filter(user_id=user_id)
            if product_id:
                inward_qs = inward_qs.filter(product_id=product_id)
            inward_qs = apply_date_filter(inward_qs, 'created_at', start_date, end_date)

            pos_qs = POSOrderItem.objects.select_related('product', 'order', 'order__user').filter(
                order__order_status='completed'
            )
            if user_id:
                pos_qs = pos_qs.filter(order__user_id=user_id)
            if product_id:
                pos_qs = pos_qs.filter(product_id=product_id)
            pos_qs = apply_date_filter(pos_qs, 'order__created_at', start_date, end_date)

            # ── NEW: shop fulfillments ───────────────────────────────────────
            shop_qs = ShopOrderItem.objects.filter(
                fulfilled_quantity__isnull=False,
                actual_price__isnull=False,
            ).select_related('product', 'order', 'fulfilled_by_manager')
            if user_id:
                shop_qs = shop_qs.filter(fulfilled_by_manager_id=user_id)
            if product_id:
                shop_qs = shop_qs.filter(product_id=product_id)
            shop_qs = apply_date_filter(shop_qs, 'order__created_at', start_date, end_date)

            rows = _build_inventory_rows(inward_qs, pos_qs, shop_qs)

            summary = {
                'total_transactions':  len(rows),
                'total_inward_qty':    round(sum(r['in_qty']     for r in rows), 2),
                'total_inward_value':  round(sum(r['in_amount']  for r in rows), 2),
                'total_outward_qty':   round(sum(r['out_qty']    for r in rows), 2),
                'total_outward_value': round(sum(r['out_amount'] for r in rows), 2),
                'pos_outward_qty':     round(sum(r['out_qty'] for r in rows if r['type'] == 'POS Sale'), 2),
                'shop_outward_qty':    round(sum(r['out_qty'] for r in rows if r['type'] == 'Shop Sale'), 2),
            }

            return Response({'success': True, 'report': 'Inventory Report (Admin)',
                'date_range': {'start_date': fmt_date(start_date), 'end_date': fmt_date(end_date)},
                'filtered_user_id': user_id, 'summary': summary, 'rows': rows})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# ─────────────────────────────────────────────────────────────────────────────
# 6. Receivable Report
# Source: posorders_posorder → customers_customer
# payment_status: 'paid' → fully received, 'unpaid'/'pending' → outstanding
# ─────────────────────────────────────────────────────────────────────────────

class ReceivableReportView(APIView):
    """
    Receivable Report — outstanding amounts per invoice.
    Columns: Sr No, Customer Name, Invoice Date, Invoice No,
             Invoice Amount, Receipts, Pending Amount, Payment Status
    Also returns customer-wise grouped summary.
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date   = parse_date_param(request.GET.get('start_date'))
            end_date     = parse_date_param(request.GET.get('end_date'))
            customer_id  = request.GET.get('customer_id')
            # only_pending: if true, show only unpaid invoices
            only_pending = request.GET.get('only_pending', 'false').lower() == 'true'

            orders = POSOrder.objects.filter(
                user=request.user
            ).select_related('customer').order_by('created_at')

            orders = apply_date_filter(orders, 'created_at', start_date, end_date)
            if customer_id:
                orders = orders.filter(customer_id=customer_id)
            if only_pending:
                orders = orders.exclude(payment_status='paid')

            rows = []
            for idx, o in enumerate(orders, 1):
                invoice_amount = safe_float(o.total_amount)
                is_paid        = o.payment_status == 'paid'
                receipts       = invoice_amount if is_paid else 0.0
                pending        = 0.0 if is_paid else invoice_amount

                customer_name = 'Walk-in'
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()

                rows.append({
                    'sr_no':           idx,
                    'customer_name':   customer_name,
                    'invoice_date':    fmt_date(o.created_at),
                    'invoice_no':      o.order_number,
                    'invoice_amount':  invoice_amount,
                    'receipts':        receipts,
                    'pending_amount':  pending,
                    'payment_status':  o.payment_status or 'N/A',
                    'payment_method':  o.payment_method or 'N/A',
                })

            # Customer-wise grouping
            from collections import defaultdict
            customer_groups = defaultdict(lambda: {
                'invoices': [], 'total_invoice': 0.0,
                'total_receipts': 0.0, 'total_pending': 0.0
            })
            for r in rows:
                g = customer_groups[r['customer_name']]
                g['invoices'].append(r)
                g['total_invoice']  += r['invoice_amount']
                g['total_receipts'] += r['receipts']
                g['total_pending']  += r['pending_amount']

            customer_wise = [
                {
                    'customer_name':   name,
                    'total_invoice':   round(g['total_invoice'],  2),
                    'total_receipts':  round(g['total_receipts'], 2),
                    'total_pending':   round(g['total_pending'],  2),
                    'invoices':        g['invoices'],
                }
                for name, g in customer_groups.items()
            ]

            summary = {
                'total_invoices':     len(rows),
                'total_invoice_amt':  round(sum(r['invoice_amount'] for r in rows), 2),
                'total_receipts':     round(sum(r['receipts']       for r in rows), 2),
                'total_pending':      round(sum(r['pending_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Receivable Report',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary':       summary,
                'rows':          rows,
                'customer_wise': customer_wise,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminReceivableReportView(APIView):
    """Admin version."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date   = parse_date_param(request.GET.get('start_date'))
            end_date     = parse_date_param(request.GET.get('end_date'))
            user_id      = request.GET.get('user_id')
            customer_id  = request.GET.get('customer_id')
            only_pending = request.GET.get('only_pending', 'false').lower() == 'true'

            orders = POSOrder.objects.select_related('customer', 'user').order_by('created_at')
            if user_id:
                orders = orders.filter(user_id=user_id)
            if customer_id:
                orders = orders.filter(customer_id=customer_id)
            if only_pending:
                orders = orders.exclude(payment_status='paid')
            orders = apply_date_filter(orders, 'created_at', start_date, end_date)

            rows = []
            for idx, o in enumerate(orders, 1):
                invoice_amount = safe_float(o.total_amount)
                is_paid        = o.payment_status == 'paid'
                receipts       = invoice_amount if is_paid else 0.0
                pending        = 0.0 if is_paid else invoice_amount

                customer_name = 'Walk-in'
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()

                rows.append({
                    'sr_no':           idx,
                    'customer_name':   customer_name,
                    'user_name':       f"{o.user.first_name} {o.user.last_name}".strip(),
                    'invoice_date':    fmt_date(o.created_at),
                    'invoice_no':      o.order_number,
                    'invoice_amount':  invoice_amount,
                    'receipts':        receipts,
                    'pending_amount':  pending,
                    'payment_status':  o.payment_status or 'N/A',
                    'payment_method':  o.payment_method or 'N/A',
                })

            from collections import defaultdict
            customer_groups = defaultdict(lambda: {
                'invoices': [], 'total_invoice': 0.0,
                'total_receipts': 0.0, 'total_pending': 0.0
            })
            for r in rows:
                g = customer_groups[r['customer_name']]
                g['invoices'].append(r)
                g['total_invoice']  += r['invoice_amount']
                g['total_receipts'] += r['receipts']
                g['total_pending']  += r['pending_amount']

            customer_wise = [
                {
                    'customer_name':  name,
                    'total_invoice':  round(g['total_invoice'],  2),
                    'total_receipts': round(g['total_receipts'], 2),
                    'total_pending':  round(g['total_pending'],  2),
                    'invoices':       g['invoices'],
                }
                for name, g in customer_groups.items()
            ]

            summary = {
                'total_invoices':    len(rows),
                'total_invoice_amt': round(sum(r['invoice_amount'] for r in rows), 2),
                'total_receipts':    round(sum(r['receipts']       for r in rows), 2),
                'total_pending':     round(sum(r['pending_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Receivable Report (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_user_id': user_id,
                'summary':          summary,
                'rows':             rows,
                'customer_wise':    customer_wise,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Age Wise Receivable Report
# Same source as Receivable but groups pending invoices into age buckets:
# 0-30, 30-60, 60-90, 90-180, Above 180 days
# ─────────────────────────────────────────────────────────────────────────────

class AgeWiseReceivableReportView(APIView):
    """
    Age Wise Receivable Report — unpaid invoices bucketed by age (days overdue).
    Columns: Customer Name, Invoice Date, Invoice No,
             0-30, 30-60, 60-90, 90-180, Above 180, Total
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date  = parse_date_param(request.GET.get('start_date'))
            end_date    = parse_date_param(request.GET.get('end_date'))
            customer_id = request.GET.get('customer_id')
            today       = timezone.now().date()

            orders = POSOrder.objects.filter(
                user=request.user
            ).exclude(payment_status='paid').select_related('customer').order_by('created_at')

            orders = apply_date_filter(orders, 'created_at', start_date, end_date)
            if customer_id:
                orders = orders.filter(customer_id=customer_id)

            def bucket(days):
                if days <= 30:   return '0_30'
                if days <= 60:   return '30_60'
                if days <= 90:   return '60_90'
                if days <= 180:  return '90_180'
                return 'above_180'

            rows = []
            for idx, o in enumerate(orders, 1):
                days_old  = (today - o.created_at.date()).days
                bkt       = bucket(days_old)
                amount    = safe_float(o.total_amount)

                customer_name = 'Walk-in'
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()

                row = {
                    'sr_no':          idx,
                    'customer_name':  customer_name,
                    'invoice_date':   fmt_date(o.created_at),
                    'invoice_no':     o.order_number,
                    'days_old':       days_old,
                    'bucket':         bkt,
                    '0_30':          amount if bkt == '0_30'    else 0.0,
                    '30_60':         amount if bkt == '30_60'   else 0.0,
                    '60_90':         amount if bkt == '60_90'   else 0.0,
                    '90_180':        amount if bkt == '90_180'  else 0.0,
                    'above_180':     amount if bkt == 'above_180' else 0.0,
                    'total':         amount,
                }
                rows.append(row)

            # Customer-wise grouping
            from collections import defaultdict
            customer_groups = defaultdict(lambda: {
                'invoices': [],
                '0_30': 0.0, '30_60': 0.0, '60_90': 0.0,
                '90_180': 0.0, 'above_180': 0.0, 'total': 0.0
            })
            for r in rows:
                g = customer_groups[r['customer_name']]
                g['invoices'].append(r)
                for k in ('0_30', '30_60', '60_90', '90_180', 'above_180', 'total'):
                    g[k] += r[k]

            customer_wise = [
                {
                    'customer_name': name,
                    '0_30':         round(g['0_30'],      2),
                    '30_60':        round(g['30_60'],     2),
                    '60_90':        round(g['60_90'],     2),
                    '90_180':       round(g['90_180'],    2),
                    'above_180':    round(g['above_180'], 2),
                    'total':        round(g['total'],     2),
                    'invoices':     g['invoices'],
                }
                for name, g in customer_groups.items()
            ]

            summary = {
                'total_pending_invoices': len(rows),
                'total_0_30':    round(sum(r['0_30']      for r in rows), 2),
                'total_30_60':   round(sum(r['30_60']     for r in rows), 2),
                'total_60_90':   round(sum(r['60_90']     for r in rows), 2),
                'total_90_180':  round(sum(r['90_180']    for r in rows), 2),
                'total_above_180': round(sum(r['above_180'] for r in rows), 2),
                'grand_total':   round(sum(r['total']     for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Age Wise Receivable Report',
                'as_of_date': fmt_date(today),
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary':       summary,
                'rows':          rows,
                'customer_wise': customer_wise,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminAgeWiseReceivableReportView(APIView):
    """Admin version."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date  = parse_date_param(request.GET.get('start_date'))
            end_date    = parse_date_param(request.GET.get('end_date'))
            user_id     = request.GET.get('user_id')
            customer_id = request.GET.get('customer_id')
            today       = timezone.now().date()

            orders = POSOrder.objects.exclude(
                payment_status='paid'
            ).select_related('customer', 'user').order_by('created_at')

            if user_id:
                orders = orders.filter(user_id=user_id)
            if customer_id:
                orders = orders.filter(customer_id=customer_id)
            orders = apply_date_filter(orders, 'created_at', start_date, end_date)

            def bucket(days):
                if days <= 30:  return '0_30'
                if days <= 60:  return '30_60'
                if days <= 90:  return '60_90'
                if days <= 180: return '90_180'
                return 'above_180'

            rows = []
            for idx, o in enumerate(orders, 1):
                days_old = (today - o.created_at.date()).days
                bkt      = bucket(days_old)
                amount   = safe_float(o.total_amount)

                customer_name = 'Walk-in'
                if o.customer:
                    customer_name = f"{o.customer.first_name} {o.customer.last_name}".strip()

                rows.append({
                    'sr_no':         idx,
                    'customer_name': customer_name,
                    'user_name':     f"{o.user.first_name} {o.user.last_name}".strip(),
                    'invoice_date':  fmt_date(o.created_at),
                    'invoice_no':    o.order_number,
                    'days_old':      days_old,
                    'bucket':        bkt,
                    '0_30':         amount if bkt == '0_30'    else 0.0,
                    '30_60':        amount if bkt == '30_60'   else 0.0,
                    '60_90':        amount if bkt == '60_90'   else 0.0,
                    '90_180':       amount if bkt == '90_180'  else 0.0,
                    'above_180':    amount if bkt == 'above_180' else 0.0,
                    'total':        amount,
                })

            from collections import defaultdict
            customer_groups = defaultdict(lambda: {
                'invoices': [],
                '0_30': 0.0, '30_60': 0.0, '60_90': 0.0,
                '90_180': 0.0, 'above_180': 0.0, 'total': 0.0
            })
            for r in rows:
                g = customer_groups[r['customer_name']]
                g['invoices'].append(r)
                for k in ('0_30', '30_60', '60_90', '90_180', 'above_180', 'total'):
                    g[k] += r[k]

            customer_wise = [
                {
                    'customer_name': name,
                    '0_30':         round(g['0_30'],      2),
                    '30_60':        round(g['30_60'],     2),
                    '60_90':        round(g['60_90'],     2),
                    '90_180':       round(g['90_180'],    2),
                    'above_180':    round(g['above_180'], 2),
                    'total':        round(g['total'],     2),
                    'invoices':     g['invoices'],
                }
                for name, g in customer_groups.items()
            ]

            summary = {
                'total_pending_invoices': len(rows),
                'total_0_30':      round(sum(r['0_30']      for r in rows), 2),
                'total_30_60':     round(sum(r['30_60']     for r in rows), 2),
                'total_60_90':     round(sum(r['60_90']     for r in rows), 2),
                'total_90_180':    round(sum(r['90_180']    for r in rows), 2),
                'total_above_180': round(sum(r['above_180'] for r in rows), 2),
                'grand_total':     round(sum(r['total']     for r in rows), 2),
            }

            return Response({
                'success': True,
                'report': 'Age Wise Receivable Report (Admin)',
                'as_of_date': fmt_date(today),
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_user_id': user_id,
                'summary':          summary,
                'rows':             rows,
                'customer_wise':    customer_wise,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ─────────────────────────────────────────────────────────────────────────────
# APPEND THESE VIEWS TO THE BOTTOM OF reports/views.py
#
# These cover Channel 2: Manager selling stock TO shop owners
# Source: shop_shoporderitem + shop_shopownerorders
# ─────────────────────────────────────────────────────────────────────────────

from shop.models import ShopOwnerOrders, ShopOrderItem


# ─────────────────────────────────────────────────────────────────────────────
# 8. Shop Sales Register
# One row per ShopOwnerOrder fulfilled by this manager.
# Columns: Sr No, Date, Order No, Shop Owner Name, Basic Amount, Total Amount
# ─────────────────────────────────────────────────────────────────────────────

class ShopSalesRegisterView(APIView):
    """
    Shop Sales Register — manager's sales to shop owners.
    One row per fulfilled order (manager's fulfilled items aggregated per order).
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date = parse_date_param(request.GET.get('start_date'))
            end_date   = parse_date_param(request.GET.get('end_date'))
            shop_owner_id = request.GET.get('shop_owner_id')

            # Get all orders where this manager fulfilled at least one item
            orders = ShopOwnerOrders.objects.filter(
                order_items__fulfilled_by_manager=request.user
            ).distinct().select_related('shop_owner').order_by('created_at')

            orders = apply_date_filter(orders, 'created_at', start_date, end_date)
            if shop_owner_id:
                orders = orders.filter(shop_owner_id=shop_owner_id)

            rows = []
            for idx, order in enumerate(orders, 1):
                # Only count items fulfilled by this manager
                manager_items = order.order_items.filter(
                    fulfilled_by_manager=request.user,
                    fulfilled_quantity__isnull=False,
                    actual_price__isnull=False,
                )
                total_amount = sum(
                    safe_float(item.fulfilled_quantity) * safe_float(item.actual_price)
                    for item in manager_items
                )
                total_qty = sum(
                    safe_float(item.fulfilled_quantity)
                    for item in manager_items
                )
                round_off = round(round(total_amount) - total_amount, 2)

                rows.append({
                    'sr_no':           idx,
                    'date':            fmt_date(order.created_at),
                    'order_no':        order.order_number,
                    'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
                    'shop_owner_phone': order.shop_owner.mobile_number or 'N/A',
                    'total_qty':       total_qty,
                    'basic_amount':    round(total_amount, 2),
                    'round_off':       round_off,
                    'total_amount':    round(total_amount, 2),
                    'order_status':    order.status,
                    # Is amount collected? completed = yes, anything else = pending
                    'payment_status':  'collected' if order.status == 'completed' else 'pending',
                })

            summary = {
                'total_orders':    len(rows),
                'total_qty':       round(sum(r['total_qty']     for r in rows), 2),
                'total_amount':    round(sum(r['total_amount']  for r in rows), 2),
                'collected':       round(sum(r['total_amount']  for r in rows if r['payment_status'] == 'collected'), 2),
                'pending':         round(sum(r['total_amount']  for r in rows if r['payment_status'] == 'pending'), 2),
            }

            return Response({
                'success': True,
                'report':  'Shop Sales Register',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminShopSalesRegisterView(APIView):
    """Admin — all managers' shop sales. Filter by manager (user_id) or shop owner."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date    = parse_date_param(request.GET.get('start_date'))
            end_date      = parse_date_param(request.GET.get('end_date'))
            manager_id    = request.GET.get('manager_id')
            shop_owner_id = request.GET.get('shop_owner_id')

            items_qs = ShopOrderItem.objects.filter(
                fulfilled_by_manager__isnull=False,
                fulfilled_quantity__isnull=False,
                actual_price__isnull=False,
            ).select_related('order', 'order__shop_owner', 'fulfilled_by_manager')

            if manager_id:
                items_qs = items_qs.filter(fulfilled_by_manager_id=manager_id)
            if shop_owner_id:
                items_qs = items_qs.filter(order__shop_owner_id=shop_owner_id)
            items_qs = apply_date_filter(items_qs, 'order__created_at', start_date, end_date)

            # Aggregate per order+manager combination
            from collections import defaultdict
            order_manager_map = defaultdict(lambda: {
                'order': None, 'manager': None, 'total_qty': 0.0, 'total_amount': 0.0
            })
            for item in items_qs:
                key = (item.order_id, item.fulfilled_by_manager_id)
                d   = order_manager_map[key]
                d['order']   = item.order
                d['manager'] = item.fulfilled_by_manager
                d['total_qty']    += safe_float(item.fulfilled_quantity)
                d['total_amount'] += safe_float(item.fulfilled_quantity) * safe_float(item.actual_price)

            rows = []
            for idx, (_, d) in enumerate(
                sorted(order_manager_map.items(), key=lambda x: x[1]['order'].created_at), 1
            ):
                order        = d['order']
                total_amount = round(d['total_amount'], 2)
                round_off    = round(round(total_amount) - total_amount, 2)
                rows.append({
                    'sr_no':           idx,
                    'date':            fmt_date(order.created_at),
                    'order_no':        order.order_number,
                    'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
                    'manager_name':    f"{d['manager'].first_name} {d['manager'].last_name}".strip(),
                    'total_qty':       round(d['total_qty'], 2),
                    'basic_amount':    total_amount,
                    'round_off':       round_off,
                    'total_amount':    total_amount,
                    'order_status':    order.status,
                    'payment_status':  'collected' if order.status == 'completed' else 'pending',
                })

            summary = {
                'total_orders':  len(rows),
                'total_qty':     round(sum(r['total_qty']    for r in rows), 2),
                'total_amount':  round(sum(r['total_amount'] for r in rows), 2),
                'collected':     round(sum(r['total_amount'] for r in rows if r['payment_status'] == 'collected'), 2),
                'pending':       round(sum(r['total_amount'] for r in rows if r['payment_status'] == 'pending'), 2),
            }

            return Response({
                'success': True,
                'report':  'Shop Sales Register (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_manager_id':    manager_id,
                'filtered_shop_owner_id': shop_owner_id,
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 9. Product Wise Shop Sales Register
# One row per fulfilled ShopOrderItem for this manager.
# Columns: Sr No, Date, Order No, Shop Owner, Product Code, Product Name,
#          Qty, Rate, Basic Amount, Round Off, Total Amount
# ─────────────────────────────────────────────────────────────────────────────

class ProductWiseShopSalesRegisterView(APIView):
    """
    Product Wise Shop Sales Register — line-item level breakdown of
    manager's sales to shop owners.
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date    = parse_date_param(request.GET.get('start_date'))
            end_date      = parse_date_param(request.GET.get('end_date'))
            shop_owner_id = request.GET.get('shop_owner_id')
            product_id    = request.GET.get('product_id')

            items = ShopOrderItem.objects.filter(
                fulfilled_by_manager=request.user,
                fulfilled_quantity__isnull=False,
                actual_price__isnull=False,
            ).select_related(
                'order', 'order__shop_owner', 'product', 'product__unit'
            ).order_by('order__created_at')

            items = apply_date_filter(items, 'order__created_at', start_date, end_date)
            if shop_owner_id:
                items = items.filter(order__shop_owner_id=shop_owner_id)
            if product_id:
                items = items.filter(product_id=product_id)

            rows = []
            for idx, item in enumerate(items, 1):
                qty          = safe_float(item.fulfilled_quantity)
                rate         = safe_float(item.actual_price)
                basic_amount = round(qty * rate, 2)
                round_off    = round(round(basic_amount) - basic_amount, 2)

                unit_name = ''
                if hasattr(item.product, 'unit') and item.product.unit:
                    unit_name = (
                        item.product.unit.unit_name
                        if hasattr(item.product.unit, 'unit_name')
                        else str(item.product.unit)
                    )

                rows.append({
                    'sr_no':           idx,
                    'date':            fmt_date(item.order.created_at),
                    'order_no':        item.order.order_number,
                    'shop_owner_name': f"{item.order.shop_owner.first_name} {item.order.shop_owner.last_name}".strip(),
                    'product_code':    item.product.sku_code or 'N/A',
                    'product_name':    item.product.product_name,
                    'qty':             qty,
                    'unit':            unit_name,
                    'rate':            rate,
                    'basic_amount':    basic_amount,
                    'round_off':       round_off,
                    'total_amount':    basic_amount,
                    'order_status':    item.order.status,
                    'payment_status':  'collected' if item.order.status == 'completed' else 'pending',
                })

            summary = {
                'total_line_items': len(rows),
                'total_qty':        round(sum(r['qty']          for r in rows), 2),
                'total_basic':      round(sum(r['basic_amount'] for r in rows), 2),
                'total_amount':     round(sum(r['total_amount'] for r in rows), 2),
                'collected':        round(sum(r['total_amount'] for r in rows if r['payment_status'] == 'collected'), 2),
                'pending':          round(sum(r['total_amount'] for r in rows if r['payment_status'] == 'pending'), 2),
            }

            return Response({
                'success': True,
                'report':  'Product Wise Shop Sales Register',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminProductWiseShopSalesRegisterView(APIView):
    """Admin version — filter by manager_id, shop_owner_id, product_id."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date    = parse_date_param(request.GET.get('start_date'))
            end_date      = parse_date_param(request.GET.get('end_date'))
            manager_id    = request.GET.get('manager_id')
            shop_owner_id = request.GET.get('shop_owner_id')
            product_id    = request.GET.get('product_id')

            items = ShopOrderItem.objects.filter(
                fulfilled_by_manager__isnull=False,
                fulfilled_quantity__isnull=False,
                actual_price__isnull=False,
            ).select_related(
                'order', 'order__shop_owner', 'fulfilled_by_manager',
                'product', 'product__unit'
            ).order_by('order__created_at')

            if manager_id:
                items = items.filter(fulfilled_by_manager_id=manager_id)
            if shop_owner_id:
                items = items.filter(order__shop_owner_id=shop_owner_id)
            if product_id:
                items = items.filter(product_id=product_id)
            items = apply_date_filter(items, 'order__created_at', start_date, end_date)

            rows = []
            for idx, item in enumerate(items, 1):
                qty          = safe_float(item.fulfilled_quantity)
                rate         = safe_float(item.actual_price)
                basic_amount = round(qty * rate, 2)
                round_off    = round(round(basic_amount) - basic_amount, 2)

                unit_name = ''
                if hasattr(item.product, 'unit') and item.product.unit:
                    unit_name = (
                        item.product.unit.unit_name
                        if hasattr(item.product.unit, 'unit_name')
                        else str(item.product.unit)
                    )

                rows.append({
                    'sr_no':           idx,
                    'date':            fmt_date(item.order.created_at),
                    'order_no':        item.order.order_number,
                    'shop_owner_name': f"{item.order.shop_owner.first_name} {item.order.shop_owner.last_name}".strip(),
                    'manager_name':    f"{item.fulfilled_by_manager.first_name} {item.fulfilled_by_manager.last_name}".strip(),
                    'product_code':    item.product.sku_code or 'N/A',
                    'product_name':    item.product.product_name,
                    'qty':             qty,
                    'unit':            unit_name,
                    'rate':            rate,
                    'basic_amount':    basic_amount,
                    'round_off':       round_off,
                    'total_amount':    basic_amount,
                    'order_status':    item.order.status,
                    'payment_status':  'collected' if item.order.status == 'completed' else 'pending',
                })

            summary = {
                'total_line_items': len(rows),
                'total_qty':        round(sum(r['qty']          for r in rows), 2),
                'total_basic':      round(sum(r['basic_amount'] for r in rows), 2),
                'total_amount':     round(sum(r['total_amount'] for r in rows), 2),
                'collected':        round(sum(r['total_amount'] for r in rows if r['payment_status'] == 'collected'), 2),
                'pending':          round(sum(r['total_amount'] for r in rows if r['payment_status'] == 'pending'), 2),
            }

            return Response({
                'success': True,
                'report':  'Product Wise Shop Sales Register (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_manager_id':    manager_id,
                'filtered_shop_owner_id': shop_owner_id,
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 10. Shop Receivable Report
# Orders fulfilled by this manager where shop owner hasn't confirmed delivery yet.
# pending  = status in [packing, delivery_in_progress, partially_fulfilled, order_placed]
# collected = status == completed
#
# Columns: Sr No, Shop Owner, Order No, Order Date, Total Amount,
#          Collected, Pending, Order Status
# ─────────────────────────────────────────────────────────────────────────────

class ShopReceivableReportView(APIView):
    """
    Shop Receivable Report — amounts owed by shop owners to this manager.
    Pending = order not yet completed (delivery not confirmed by shop owner).
    Collected = order status is 'completed'.
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date    = parse_date_param(request.GET.get('start_date'))
            end_date      = parse_date_param(request.GET.get('end_date'))
            shop_owner_id = request.GET.get('shop_owner_id')
            only_pending  = request.GET.get('only_pending', 'false').lower() == 'true'

            orders = ShopOwnerOrders.objects.filter(
                order_items__fulfilled_by_manager=request.user
            ).distinct().select_related('shop_owner').order_by('created_at')

            orders = apply_date_filter(orders, 'created_at', start_date, end_date)
            if shop_owner_id:
                orders = orders.filter(shop_owner_id=shop_owner_id)
            if only_pending:
                orders = orders.exclude(status='completed')

            rows = []
            for idx, order in enumerate(orders, 1):
                manager_items = order.order_items.filter(
                    fulfilled_by_manager=request.user,
                    fulfilled_quantity__isnull=False,
                    actual_price__isnull=False,
                )
                total_amount = round(sum(
                    safe_float(i.fulfilled_quantity) * safe_float(i.actual_price)
                    for i in manager_items
                ), 2)

                is_collected = order.status == 'completed'
                collected    = total_amount if is_collected else 0.0
                pending      = 0.0 if is_collected else total_amount

                rows.append({
                    'sr_no':           idx,
                    'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
                    'shop_owner_phone': order.shop_owner.mobile_number or 'N/A',
                    'order_no':        order.order_number,
                    'order_date':      fmt_date(order.created_at),
                    'total_amount':    total_amount,
                    'collected':       collected,
                    'pending_amount':  pending,
                    'order_status':    order.status,
                    'payment_status':  'collected' if is_collected else 'pending',
                })

            # Shop owner wise grouping
            from collections import defaultdict
            shop_groups = defaultdict(lambda: {
                'orders': [], 'total_amount': 0.0, 'collected': 0.0, 'pending': 0.0
            })
            for r in rows:
                g = shop_groups[r['shop_owner_name']]
                g['orders'].append(r)
                g['total_amount'] += r['total_amount']
                g['collected']    += r['collected']
                g['pending']      += r['pending_amount']

            shop_owner_wise = [
                {
                    'shop_owner_name': name,
                    'total_amount':    round(g['total_amount'], 2),
                    'collected':       round(g['collected'],    2),
                    'pending':         round(g['pending'],      2),
                    'orders':          g['orders'],
                }
                for name, g in shop_groups.items()
            ]

            summary = {
                'total_orders':  len(rows),
                'total_amount':  round(sum(r['total_amount']   for r in rows), 2),
                'collected':     round(sum(r['collected']      for r in rows), 2),
                'total_pending': round(sum(r['pending_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report':  'Shop Receivable Report',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary':         summary,
                'rows':            rows,
                'shop_owner_wise': shop_owner_wise,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminShopReceivableReportView(APIView):
    """Admin — view shop receivables across all managers."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date    = parse_date_param(request.GET.get('start_date'))
            end_date      = parse_date_param(request.GET.get('end_date'))
            manager_id    = request.GET.get('manager_id')
            shop_owner_id = request.GET.get('shop_owner_id')
            only_pending  = request.GET.get('only_pending', 'false').lower() == 'true'

            items_qs = ShopOrderItem.objects.filter(
                fulfilled_by_manager__isnull=False,
                fulfilled_quantity__isnull=False,
                actual_price__isnull=False,
            ).select_related('order', 'order__shop_owner', 'fulfilled_by_manager')

            if manager_id:
                items_qs = items_qs.filter(fulfilled_by_manager_id=manager_id)
            if shop_owner_id:
                items_qs = items_qs.filter(order__shop_owner_id=shop_owner_id)
            if only_pending:
                items_qs = items_qs.exclude(order__status='completed')
            items_qs = apply_date_filter(items_qs, 'order__created_at', start_date, end_date)

            # Aggregate per order + manager
            from collections import defaultdict
            order_manager_map = defaultdict(lambda: {
                'order': None, 'manager': None, 'total_amount': 0.0
            })
            for item in items_qs:
                key = (item.order_id, item.fulfilled_by_manager_id)
                d   = order_manager_map[key]
                d['order']   = item.order
                d['manager'] = item.fulfilled_by_manager
                d['total_amount'] += safe_float(item.fulfilled_quantity) * safe_float(item.actual_price)

            rows = []
            for idx, (_, d) in enumerate(
                sorted(order_manager_map.items(), key=lambda x: x[1]['order'].created_at), 1
            ):
                order        = d['order']
                total_amount = round(d['total_amount'], 2)
                is_collected = order.status == 'completed'
                rows.append({
                    'sr_no':           idx,
                    'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
                    'manager_name':    f"{d['manager'].first_name} {d['manager'].last_name}".strip(),
                    'order_no':        order.order_number,
                    'order_date':      fmt_date(order.created_at),
                    'total_amount':    total_amount,
                    'collected':       total_amount if is_collected else 0.0,
                    'pending_amount':  0.0 if is_collected else total_amount,
                    'order_status':    order.status,
                    'payment_status':  'collected' if is_collected else 'pending',
                })

            summary = {
                'total_orders':  len(rows),
                'total_amount':  round(sum(r['total_amount']   for r in rows), 2),
                'collected':     round(sum(r['collected']      for r in rows), 2),
                'total_pending': round(sum(r['pending_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report':  'Shop Receivable Report (Admin)',
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_manager_id':    manager_id,
                'filtered_shop_owner_id': shop_owner_id,
                'summary':    summary,
                'rows':       rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# 11. Age Wise Shop Receivable Report
# Same as ShopReceivableReport but pending orders bucketed by age (days since order).
# Buckets: 0-30, 30-60, 60-90, 90-180, Above 180 days
# Only shows PENDING orders (not completed).
# ─────────────────────────────────────────────────────────────────────────────

class AgeWiseShopReceivableReportView(APIView):
    """
    Age Wise Shop Receivable Report — pending shop owner amounts bucketed by
    how many days the order has been outstanding.
    """
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "reports"

    def get(self, request):
        try:
            start_date    = parse_date_param(request.GET.get('start_date'))
            end_date      = parse_date_param(request.GET.get('end_date'))
            shop_owner_id = request.GET.get('shop_owner_id')
            today         = timezone.now().date()

            # Only pending orders (not completed, not cancelled)
            orders = ShopOwnerOrders.objects.filter(
                order_items__fulfilled_by_manager=request.user
            ).exclude(
                status__in=['completed', 'cancelled']
            ).distinct().select_related('shop_owner').order_by('created_at')

            orders = apply_date_filter(orders, 'created_at', start_date, end_date)
            if shop_owner_id:
                orders = orders.filter(shop_owner_id=shop_owner_id)

            def bucket(days):
                if days <= 30:  return '0_30'
                if days <= 60:  return '30_60'
                if days <= 90:  return '60_90'
                if days <= 180: return '90_180'
                return 'above_180'

            rows = []
            for idx, order in enumerate(orders, 1):
                manager_items = order.order_items.filter(
                    fulfilled_by_manager=request.user,
                    fulfilled_quantity__isnull=False,
                    actual_price__isnull=False,
                )
                total_amount = round(sum(
                    safe_float(i.fulfilled_quantity) * safe_float(i.actual_price)
                    for i in manager_items
                ), 2)

                days_old = (today - order.created_at.date()).days
                bkt      = bucket(days_old)

                rows.append({
                    'sr_no':           idx,
                    'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
                    'shop_owner_phone': order.shop_owner.mobile_number or 'N/A',
                    'order_no':        order.order_number,
                    'order_date':      fmt_date(order.created_at),
                    'days_old':        days_old,
                    'bucket':          bkt,
                    'order_status':    order.status,
                    'total_amount':    total_amount,
                    '0_30':           total_amount if bkt == '0_30'    else 0.0,
                    '30_60':          total_amount if bkt == '30_60'   else 0.0,
                    '60_90':          total_amount if bkt == '60_90'   else 0.0,
                    '90_180':         total_amount if bkt == '90_180'  else 0.0,
                    'above_180':      total_amount if bkt == 'above_180' else 0.0,
                })

            # Shop owner wise grouping
            from collections import defaultdict
            shop_groups = defaultdict(lambda: {
                'orders': [],
                '0_30': 0.0, '30_60': 0.0, '60_90': 0.0,
                '90_180': 0.0, 'above_180': 0.0, 'total': 0.0
            })
            for r in rows:
                g = shop_groups[r['shop_owner_name']]
                g['orders'].append(r)
                for k in ('0_30', '30_60', '60_90', '90_180', 'above_180'):
                    g[k] += r[k]
                g['total'] += r['total_amount']

            shop_owner_wise = [
                {
                    'shop_owner_name': name,
                    '0_30':           round(g['0_30'],      2),
                    '30_60':          round(g['30_60'],     2),
                    '60_90':          round(g['60_90'],     2),
                    '90_180':         round(g['90_180'],    2),
                    'above_180':      round(g['above_180'], 2),
                    'total':          round(g['total'],     2),
                    'orders':         g['orders'],
                }
                for name, g in shop_groups.items()
            ]

            summary = {
                'total_pending_orders': len(rows),
                'total_0_30':      round(sum(r['0_30']        for r in rows), 2),
                'total_30_60':     round(sum(r['30_60']       for r in rows), 2),
                'total_60_90':     round(sum(r['60_90']       for r in rows), 2),
                'total_90_180':    round(sum(r['90_180']      for r in rows), 2),
                'total_above_180': round(sum(r['above_180']   for r in rows), 2),
                'grand_total':     round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report':  'Age Wise Shop Receivable Report',
                'as_of_date': fmt_date(today),
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'summary':         summary,
                'rows':            rows,
                'shop_owner_wise': shop_owner_wise,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminAgeWiseShopReceivableReportView(APIView):
    """Admin version."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        try:
            start_date    = parse_date_param(request.GET.get('start_date'))
            end_date      = parse_date_param(request.GET.get('end_date'))
            manager_id    = request.GET.get('manager_id')
            shop_owner_id = request.GET.get('shop_owner_id')
            today         = timezone.now().date()

            items_qs = ShopOrderItem.objects.filter(
                fulfilled_by_manager__isnull=False,
                fulfilled_quantity__isnull=False,
                actual_price__isnull=False,
            ).exclude(
                order__status__in=['completed', 'cancelled']
            ).select_related('order', 'order__shop_owner', 'fulfilled_by_manager')

            if manager_id:
                items_qs = items_qs.filter(fulfilled_by_manager_id=manager_id)
            if shop_owner_id:
                items_qs = items_qs.filter(order__shop_owner_id=shop_owner_id)
            items_qs = apply_date_filter(items_qs, 'order__created_at', start_date, end_date)

            def bucket(days):
                if days <= 30:  return '0_30'
                if days <= 60:  return '30_60'
                if days <= 90:  return '60_90'
                if days <= 180: return '90_180'
                return 'above_180'

            from collections import defaultdict
            order_manager_map = defaultdict(lambda: {
                'order': None, 'manager': None, 'total_amount': 0.0
            })
            for item in items_qs:
                key = (item.order_id, item.fulfilled_by_manager_id)
                d   = order_manager_map[key]
                d['order']   = item.order
                d['manager'] = item.fulfilled_by_manager
                d['total_amount'] += safe_float(item.fulfilled_quantity) * safe_float(item.actual_price)

            rows = []
            for idx, (_, d) in enumerate(
                sorted(order_manager_map.items(), key=lambda x: x[1]['order'].created_at), 1
            ):
                order        = d['order']
                total_amount = round(d['total_amount'], 2)
                days_old     = (today - order.created_at.date()).days
                bkt          = bucket(days_old)

                rows.append({
                    'sr_no':           idx,
                    'shop_owner_name': f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
                    'manager_name':    f"{d['manager'].first_name} {d['manager'].last_name}".strip(),
                    'order_no':        order.order_number,
                    'order_date':      fmt_date(order.created_at),
                    'days_old':        days_old,
                    'bucket':          bkt,
                    'order_status':    order.status,
                    'total_amount':    total_amount,
                    '0_30':           total_amount if bkt == '0_30'    else 0.0,
                    '30_60':          total_amount if bkt == '30_60'   else 0.0,
                    '60_90':          total_amount if bkt == '60_90'   else 0.0,
                    '90_180':         total_amount if bkt == '90_180'  else 0.0,
                    'above_180':      total_amount if bkt == 'above_180' else 0.0,
                })

            summary = {
                'total_pending_orders': len(rows),
                'total_0_30':      round(sum(r['0_30']        for r in rows), 2),
                'total_30_60':     round(sum(r['30_60']       for r in rows), 2),
                'total_60_90':     round(sum(r['60_90']       for r in rows), 2),
                'total_90_180':    round(sum(r['90_180']      for r in rows), 2),
                'total_above_180': round(sum(r['above_180']   for r in rows), 2),
                'grand_total':     round(sum(r['total_amount'] for r in rows), 2),
            }

            return Response({
                'success': True,
                'report':  'Age Wise Shop Receivable Report (Admin)',
                'as_of_date': fmt_date(today),
                'date_range': {
                    'start_date': fmt_date(start_date),
                    'end_date':   fmt_date(end_date),
                },
                'filtered_manager_id':    manager_id,
                'filtered_shop_owner_id': shop_owner_id,
                'summary': summary,
                'rows':    rows,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)