from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.premissions import HasModuleAccess, IsOwnerOrAdmin
from posorders.models import POSOrder, POSOrderItem, POSPaymentTransaction
from django.utils.dateparse import parse_date

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

class POSOrderInvoicePDFBaseView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "view-posorder-invoices"

    def generate_pdf(self, request, order_id):
        order = get_object_or_404(POSOrder, pk=order_id)
        self.check_object_permissions(request, order)

        items_qs = POSOrderItem.objects.filter(order=order).select_related('product').order_by('id')
        if not items_qs.exists():
            return None, None

        items = []
        for oi in items_qs:
            product = oi.product
            items.append({
                "product_name": product.product_name,
                "sku": getattr(product, 'sku_code', '') or 'N/A',
                "unit": product.unit or 'N/A',
                "quantity": oi.quantity,
                "unit_price": float(oi.unit_price or 0),
                "total_price": float(oi.total_price or 0),
            })

        context = {
            "invoice_title": "POS ORDER INVOICE",
            "order_number": order.order_number,
            "date": format_date(order.created_at),
            "year": order.created_at.year if order.created_at else '',
            # Customer info
            "customer_name": f"{order.customer.first_name} {order.customer.last_name}".strip() if order.customer else "N/A",
            "customer_phone": getattr(order.customer, 'phone', None) or 'N/A',
            "customer_email": getattr(order.customer, 'email', None) or 'N/A',
            "customer_address": order.address or 'N/A',
            "customer_city": order.city or 'N/A',
            "customer_zip": order.zipcode or 'N/A',
            # Order meta
            "payment_method": order.payment_method or 'N/A',
            "order_status": order.order_status or 'N/A',
            "payment_status": order.payment_status or 'N/A',
            # Totals
            "subtotal": float(order.subtotal or 0),
            "cgst_percentage": float(order.cgst_percentage or 0),
            "cgst_amount": float(order.cgst_amount or 0),
            "sgst_percentage": float(order.sgst_percentage or 0),
            "sgst_amount": float(order.sgst_amount or 0),
            "discount_amount": float(order.discount_amount or 0),
            "transport_charges": float(order.transport_charges or 0),
            "labour_charges": float(order.labour_charges or 0),
            "total_amount": float(order.total_amount or 0),
            # Payment tracking
            "amount_paid": float(order.amount_paid or 0),
            "remaining_amount": float(order.remaining_amount or 0),
            "online_amount": float(order.online_amount or 0),
            "offline_amount": float(order.offline_amount or 0),
            # Items
            "items": items,
            "user_name": f"{request.user.first_name} {request.user.last_name}".strip(),
        }

        html_string = render_to_string("posorder_invoice.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()

        return pdf_result, order.order_number

class POSOrderInvoicePDFView(POSOrderInvoicePDFBaseView):
    """View PDF inline in browser"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No items found for this order.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=order_{order_number}.pdf'
        response.write(pdf_result)
        return response

class POSOrderInvoicePDFDownloadView(POSOrderInvoicePDFBaseView):
    """Download PDF"""
    def get(self, request, order_id):
        pdf_result, order_number = self.generate_pdf(request, order_id)
        if not pdf_result:
            return HttpResponse("No items found for this order.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=order_{order_number}.pdf'
        response.write(pdf_result)
        return response


class POSPaymentReceiptBaseView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "view-posorder-invoices"

    def generate_pdf(self, request, order_id, transaction_id):
        order = get_object_or_404(POSOrder, pk=order_id)
        self.check_object_permissions(request, order)
        txn = get_object_or_404(POSPaymentTransaction, pk=transaction_id, order=order)

        total_paid_now = txn.previous_paid + txn.amount
        from decimal import Decimal
        remaining_after = max(Decimal('0'), txn.total_order_amount - total_paid_now)

        context = {
            "receipt_number": f"RCP-{txn.id:04d}",
            "order_number": order.order_number,
            "date": format_date(txn.created_at),
            "year": txn.created_at.year if txn.created_at else '',
            "customer_name": f"{order.customer.first_name} {order.customer.last_name}".strip() if order.customer else "N/A",
            "customer_phone": getattr(order.customer, 'phone', None) or 'N/A',
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


class POSPaymentReceiptView(POSPaymentReceiptBaseView):
    """View payment receipt PDF inline"""
    def get(self, request, order_id, transaction_id):
        pdf_result, name = self.generate_pdf(request, order_id, transaction_id)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=receipt_{name}.pdf'
        response.write(pdf_result)
        return response


class POSPaymentReceiptDownloadView(POSPaymentReceiptBaseView):
    """Download payment receipt PDF"""
    def get(self, request, order_id, transaction_id):
        pdf_result, name = self.generate_pdf(request, order_id, transaction_id)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=receipt_{name}.pdf'
        response.write(pdf_result)
        return response
