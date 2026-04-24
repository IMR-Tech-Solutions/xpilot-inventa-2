from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.premissions import HasModuleAccess, IsOwnerOrAdmin
from .models import ShopOwnerOrders, ShopOrderItem, ShopPaymentTransaction, S2SOrder
from django.utils.dateparse import parse_date
from accounts.models import UserMaster
from django.http import Http404

def build_item_transporter_context(item):
    """Return transporter delivery details from item-level fields (per-manager)."""
    t = item.item_delivery_transporter if item else None
    if not t:
        return {"has_transporter": False}
    return {
        "has_transporter": True,
        "transporter_name": t.transporter_name or '',
        "transporter_contact": t.contact_number or '',
        "license_number": t.license_number or '',
        "rc_number": t.rc_number or '',
        "vehicle_number": t.vehicle_number or '',
        "vehicle_type": t.vehicle_type or '',
        "delivery_from": item.item_delivery_from or '',
        "delivery_to": item.item_delivery_to or '',
        "delivery_transporter_cost": float(item.item_delivery_transporter_cost) if item.item_delivery_transporter_cost else None,
    }


def build_transporter_context(order):
    """Return transporter delivery details dict for template context."""
    t = order.delivery_transporter
    if not t:
        return {"has_transporter": False}
    return {
        "has_transporter": True,
        "transporter_name": t.transporter_name or '',
        "transporter_contact": t.contact_number or '',
        "license_number": t.license_number or '',
        "rc_number": t.rc_number or '',
        "vehicle_number": t.vehicle_number or '',
        "vehicle_type": t.vehicle_type or '',
        "delivery_from": order.delivery_from or '',
        "delivery_to": order.delivery_to or '',
        "delivery_transporter_cost": float(order.delivery_transporter_cost) if order.delivery_transporter_cost else None,
    }


def format_date(date_val):
    if not date_val:
        return ''
    if hasattr(date_val, 'strftime'):
        try:
            return date_val.strftime("%d %B %Y")
        except Exception:
            pass
    dt = parse_date(str(date_val))
    return dt.strftime("%d %B %Y") if dt else ''

class ManagerOrderInvoicePDFBaseView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"

    def generate_pdf(self, request, order_id):
        try:
            order = ShopOwnerOrders.objects.select_related('delivery_transporter').get(id=order_id)
        except ShopOwnerOrders.DoesNotExist:
            raise Http404("Order not found")

        if order.status == 'cancelled':
            raise Http404("Invoice not available for cancelled orders")

        manager_items = order.order_items.filter(
            fulfilled_by_manager=request.user
        ).select_related('product', 'item_delivery_transporter')

        if not manager_items.exists():
            return None, None

        items = []
        total_amount = 0
        first_item = None

        for item in manager_items:
            if first_item is None:
                first_item = item
            item_total = item.fulfilled_quantity * item.actual_price
            total_amount += item_total
            items.append({
                "product_name": item.product.product_name,
                "sku": item.product.sku_code or 'N/A',
                "unit": item.product.unit or 'N/A',
                "quantity": item.fulfilled_quantity,
                "unit_price": float(item.actual_price),
                "total_price": float(item_total),
            })

        context = {
            "invoice_title": "SALES INVOICE",
            "order_number": order.order_number,
            "date": format_date(order.created_at),
            "year": order.created_at.year if order.created_at else '',
            "customer_name": f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
            "customer_phone": order.shop_owner.mobile_number or 'N/A',
            "customer_email": order.shop_owner.email or 'N/A',
            "seller_name": f"{request.user.first_name} {request.user.last_name}".strip(),
            "seller_phone": request.user.mobile_number or 'N/A',
            "seller_email": request.user.email or 'N/A',
            "subtotal": float(total_amount),
            "total_amount": float(total_amount),
            "items": items,
            "transporter": build_item_transporter_context(first_item),
        }

        html_string = render_to_string("manager_invoice.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()

        return pdf_result, order.order_number

class ManagerOrderInvoicePDFView(ManagerOrderInvoicePDFBaseView):
    """View manager invoice PDF inline in browser"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No items found for this order.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=manager_invoice_{order_number}.pdf'
        response.write(pdf_result)
        return response

class ManagerOrderInvoicePDFDownloadView(ManagerOrderInvoicePDFBaseView):
    """Download manager invoice PDF"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No items found for this order.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=manager_invoice_{order_number}.pdf'
        response.write(pdf_result)
        return response

class ManagerOrderDeliveryChallanPDFDownloadView(ManagerOrderInvoicePDFBaseView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"

    def get(self, request, order_id):
        pdf_result, order_number = self.generate_delivery_challan_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No items found for this order.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=delivery_challan_{order_number}.pdf'
        response.write(pdf_result)
        return response

    def generate_delivery_challan_pdf(self, request, order_id):
        try:
            order = ShopOwnerOrders.objects.select_related('delivery_transporter').get(id=order_id)
        except ShopOwnerOrders.DoesNotExist:
            raise Http404("Order not found")

        if order.status == 'cancelled':
            raise Http404("Delivery challan not available for cancelled orders")

        manager_items = order.order_items.filter(
            fulfilled_by_manager=request.user
        ).select_related('product', 'item_delivery_transporter')

        if not manager_items.exists():
            return None, None

        items = []
        first_item = None
        for item in manager_items:
            if first_item is None:
                first_item = item
            items.append({
                "product_name": item.product.product_name,
                "sku": item.product.sku_code or 'N/A',
                "unit": item.product.unit or 'N/A',
                "quantity": item.fulfilled_quantity,
            })

        context = {
            "order_number": order.order_number,
            "date": format_date(order.created_at),
            "year": order.created_at.year if order.created_at else '',
            "customer_name": f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
            "customer_phone": order.shop_owner.mobile_number or 'N/A',
            "customer_email": order.shop_owner.email or 'N/A',
            "seller_name": f"{request.user.first_name} {request.user.last_name}".strip(),
            "seller_phone": request.user.mobile_number or 'N/A',
            "seller_email": request.user.email or 'N/A',
            "items": items,
            "transporter": build_item_transporter_context(first_item),
        }

        html_string = render_to_string("delivery_challan.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()

        return pdf_result, order.order_number



#shop owners 
class ShopOwnerOrderItemInvoicePDFBaseView(APIView):
    """Generate invoice for specific order item (product-level)"""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"

    def generate_pdf(self, request, order_id, item_id):
        order = get_object_or_404(
            ShopOwnerOrders.objects.select_related('delivery_transporter'),
            id=order_id,
            shop_owner=request.user
        )

        if order.status == 'cancelled':
            raise Http404("Invoice not available for cancelled orders")

        # Get specific order item
        order_item = get_object_or_404(
            ShopOrderItem,
            id=item_id,
            order=order,
            fulfilled_by_manager__isnull=False  # Only fulfilled items
        )
        
        manager = order_item.fulfilled_by_manager
        item_total = order_item.fulfilled_quantity * order_item.actual_price
        
        items = [{
            "product_name": order_item.product.product_name,
            "sku": order_item.product.sku_code or 'N/A',
            "unit": order_item.product.unit or 'N/A',
            "quantity": order_item.fulfilled_quantity,
            "unit_price": float(order_item.actual_price),
            "total_price": float(item_total),
        }]

        context = {
            "invoice_title": "PURCHASE INVOICE",
            "order_number": order.order_number,
            "date": format_date(order.created_at),
            "year": order.created_at.year if order.created_at else '',
            # Buyer info (Shop Owner)
            "buyer_name": f"{request.user.first_name} {request.user.last_name}".strip(),
            "buyer_phone": request.user.mobile_number or 'N/A',
            "buyer_email": request.user.email or 'N/A',
            # Seller info (Manager)
            "seller_name": f"{manager.first_name} {manager.last_name}".strip(),
            "seller_phone": manager.mobile_number or 'N/A',
            "seller_email": manager.email or 'N/A',
            "subtotal": float(item_total),
            "total_amount": float(item_total),
            "items": items,
            "transporter": build_transporter_context(order),
        }

        html_string = render_to_string("shopowner_manager_invoice.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()

        return pdf_result, f"{order.order_number}_{order_item.product.product_name}"

class ShopOwnerOrderItemInvoicePDFView(ShopOwnerOrderItemInvoicePDFBaseView):
    """View shop owner's invoice for specific product"""
    def get(self, request, order_id, item_id):
        pdf_result, filename = self.generate_pdf(request, order_id, item_id)
        if not pdf_result:
            return HttpResponse("No items found for this order item.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=purchase_invoice_{filename}.pdf'
        response.write(pdf_result)
        return response

class ShopOwnerOrderItemInvoicePDFDownloadView(ShopOwnerOrderItemInvoicePDFBaseView):
    """Download shop owner's invoice for specific product"""
    def get(self, request, order_id, item_id):
        pdf_result, filename = self.generate_pdf(request, order_id, item_id)
        if not pdf_result:
            return HttpResponse("No items found for this order item.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=purchase_invoice_{filename}.pdf'
        response.write(pdf_result)
        return response


class ShopOwnerOrderSalesInvoicePDFBaseView(APIView):
    """Generate whole-order sales invoice for shop owner (completed orders only)"""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"

    def generate_pdf(self, request, order_id):
        order = get_object_or_404(
            ShopOwnerOrders.objects.select_related('delivery_transporter'),
            id=order_id,
            shop_owner=request.user
        )

        if order.status != 'completed':
            raise Http404("Sales invoice is only available for completed orders")

        fulfilled_items = order.order_items.filter(
            fulfilled_by_manager__isnull=False
        ).select_related('product')

        if not fulfilled_items.exists():
            return None, None

        items = []
        total_amount = 0
        for item in fulfilled_items:
            item_total = item.fulfilled_quantity * item.actual_price
            total_amount += item_total
            items.append({
                "product_name": item.product.product_name,
                "sku": item.product.sku_code or 'N/A',
                "unit": item.product.unit or 'N/A',
                "quantity": item.fulfilled_quantity,
                "unit_price": float(item.actual_price),
                "total_price": float(item_total),
            })

        admin_user = UserMaster.objects.filter(is_superuser=True).first()

        context = {
            "invoice_title": "SALES INVOICE",
            "hide_seller": True,
            "order_number": order.order_number,
            "date": format_date(order.created_at),
            "year": order.created_at.year if order.created_at else '',
            "customer_name": f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
            "customer_phone": order.shop_owner.mobile_number or 'N/A',
            "customer_email": order.shop_owner.email or 'N/A',
            "subtotal": float(total_amount),
            "total_amount": float(total_amount),
            "items": items,
            "transporter": build_transporter_context(order),
        }

        html_string = render_to_string("manager_invoice.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()

        return pdf_result, order.order_number


class ShopOwnerOrderSalesInvoicePDFView(ShopOwnerOrderSalesInvoicePDFBaseView):
    """View whole-order sales invoice inline in browser"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No fulfilled items found for this order.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=sales_invoice_{order_number}.pdf'
        response.write(pdf_result)
        return response


class ShopOwnerOrderSalesInvoicePDFDownloadView(ShopOwnerOrderSalesInvoicePDFBaseView):
    """Download whole-order sales invoice"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No fulfilled items found for this order.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=sales_invoice_{order_number}.pdf'
        response.write(pdf_result)
        return response


class ShopPaymentReceiptBaseView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-request"

    def generate_pdf(self, request, order_id, transaction_id):
        order = get_object_or_404(ShopOwnerOrders, pk=order_id)
        txn = get_object_or_404(ShopPaymentTransaction, pk=transaction_id, order=order)

        from decimal import Decimal
        total_paid_now = txn.previous_paid + txn.amount
        remaining_after = max(Decimal('0'), txn.total_order_amount - total_paid_now)

        context = {
            "receipt_number": f"RCP-{txn.id:04d}",
            "order_number": order.order_number,
            "date": format_date(txn.created_at),
            "year": txn.created_at.year if txn.created_at else '',
            "customer_name": f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
            "customer_phone": order.shop_owner.mobile_number or 'N/A',
            "payment_method": txn.payment_method or 'N/A',
            "this_payment": float(txn.amount),
            "previous_paid": float(txn.previous_paid),
            "total_paid_now": float(total_paid_now),
            "total_order_amount": float(txn.total_order_amount),
            "remaining_after": float(remaining_after),
            "online_amount": float(txn.online_amount),
            "offline_amount": float(txn.offline_amount),
            "recorded_by": f"{txn.recorded_by.first_name} {txn.recorded_by.last_name}".strip() if txn.recorded_by else "N/A",
            "is_fully_paid": remaining_after == 0,
        }

        html_string = render_to_string("payment_receipt.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()
        return pdf_result, f"{order.order_number}-RCP{txn.id:04d}"


class ShopPaymentReceiptView(ShopPaymentReceiptBaseView):
    """View shop payment receipt PDF inline"""
    def get(self, request, order_id, transaction_id):
        pdf_result, name = self.generate_pdf(request, order_id, transaction_id)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=receipt_{name}.pdf'
        response.write(pdf_result)
        return response


class ShopPaymentReceiptDownloadView(ShopPaymentReceiptBaseView):
    """Download shop payment receipt PDF"""
    def get(self, request, order_id, transaction_id):
        pdf_result, name = self.generate_pdf(request, order_id, transaction_id)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=receipt_{name}.pdf'
        response.write(pdf_result)
        return response


# ── S2S Invoice ───────────────────────────────────────────────────────────────

class S2SInvoicePDFBaseView(APIView):
    """Generate sales invoice for a completed S2S order (accessible by buyer or seller)."""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "shop-access"

    def generate_pdf(self, request, order_id):
        try:
            order = S2SOrder.objects.select_related(
                'buyer', 'seller', 'delivery_transporter'
            ).get(id=order_id)
        except S2SOrder.DoesNotExist:
            raise Http404("Order not found")

        if request.user.id not in (order.buyer_id, order.seller_id):
            raise Http404("Access denied")

        if order.status == 'cancelled':
            raise Http404("Invoice not available for cancelled orders")

        accepted_items = order.order_items.filter(
            item_status='accepted'
        ).select_related('seller_product__product', 'seller_product__product__unit')

        if not accepted_items.exists():
            return None, None

        items = []
        total_amount = 0
        for item in accepted_items:
            item_total = (item.fulfilled_quantity or 0) * (item.actual_price or 0)
            total_amount += item_total
            items.append({
                "product_name": item.seller_product.product.product_name,
                "sku": item.seller_product.product.sku_code or 'N/A',
                "unit": item.seller_product.product.unit.unitName if item.seller_product.product.unit else 'N/A',
                "quantity": item.fulfilled_quantity,
                "unit_price": float(item.actual_price or 0),
                "total_price": float(item_total),
            })

        t = order.delivery_transporter
        if t:
            transporter_ctx = {
                "has_transporter": True,
                "transporter_name": t.transporter_name or '',
                "transporter_contact": t.contact_number or '',
                "license_number": t.license_number or '',
                "rc_number": t.rc_number or '',
                "vehicle_number": t.vehicle_number or '',
                "vehicle_type": t.vehicle_type or '',
                "delivery_from": order.delivery_from or '',
                "delivery_to": order.delivery_to or '',
                "delivery_transporter_cost": float(order.delivery_transporter_cost) if order.delivery_transporter_cost else None,
            }
        else:
            transporter_ctx = {"has_transporter": False}

        context = {
            "invoice_title": "SALES INVOICE",
            "order_number": order.order_number,
            "date": format_date(order.created_at),
            "year": order.created_at.year if order.created_at else '',
            "seller_name": f"{order.seller.first_name} {order.seller.last_name}".strip(),
            "seller_phone": order.seller.mobile_number or 'N/A',
            "seller_email": order.seller.email or 'N/A',
            "customer_name": f"{order.buyer.first_name} {order.buyer.last_name}".strip(),
            "customer_phone": order.buyer.mobile_number or 'N/A',
            "customer_email": order.buyer.email or 'N/A',
            "subtotal": float(total_amount),
            "total_amount": float(total_amount),
            "items": items,
            "transporter": transporter_ctx,
        }

        html_string = render_to_string("manager_invoice.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()
        return pdf_result, order.order_number


class S2SInvoicePDFView(S2SInvoicePDFBaseView):
    """View S2S invoice inline in browser"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No accepted items found.", status=404)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=s2s_invoice_{order_number}.pdf'
        response.write(pdf_result)
        return response


class S2SInvoicePDFDownloadView(S2SInvoicePDFBaseView):
    """Download S2S invoice"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No accepted items found.", status=404)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=s2s_invoice_{order_number}.pdf'
        response.write(pdf_result)
        return response
