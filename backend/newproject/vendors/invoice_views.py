from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.premissions import HasModuleAccess, IsOwnerOrAdmin
from vendors.models import VendorInvoice
from inventory.models import StockEntry
from django.conf import settings
from django.utils.dateparse import parse_date

def format_date(date_str):
    if not date_str:
        return ''
    if hasattr(date_str, 'strftime'):
        return date_str.strftime("%d %B %Y")
    dt = parse_date(str(date_str))
    return dt.strftime("%d %B %Y") if dt else ''

class VendorInvoicePDFBaseView(APIView):
    permission_classes = [IsAuthenticated, HasModuleAccess, IsOwnerOrAdmin]
    required_permission = "view-vendor-invoices"

    def generate_pdf(self, request, invoice_id):
        invoice = get_object_or_404(VendorInvoice, pk=invoice_id)
        self.check_object_permissions(request, invoice) 
        
        vendor = invoice.vendor

        # Get stock entries linked to this invoice
        entries = StockEntry.objects.filter(
            vendor_invoice=invoice
        ).select_related('product').order_by('created_at')

        if not entries.exists():
            return None, None

        subtotal = 0
        total_cgst = 0
        total_sgst = 0
        total_broker_commission = 0
        items = []

        # Shared invoice-level costs are stored on each entry but are the same value
        first_entry = entries.first()
        transporter_cost = float(first_entry.transporter_cost or 0)
        varne_cost = float(first_entry.varne_cost or 0)
        labour_cost = float(first_entry.labour_cost or 0)
        transporter_name = (
            first_entry.transporter.transporter_name
            if first_entry.transporter else None
        )
        transporter_contact = (
            first_entry.transporter.contact_number or 'N/A'
            if first_entry.transporter else None
        )
        transporter_vehicle = (
            first_entry.transporter.vehicle_number or None
            if first_entry.transporter else None
        )

        for entry in entries:
            product = entry.product
            item_total = float(entry.quantity) * float(entry.purchase_price)
            cgst_pct = float(entry.cgst_percentage or 0)
            sgst_pct = float(entry.sgst_percentage or 0)
            cgst_amt = float(entry.cgst or 0)
            sgst_amt = float(entry.sgst or 0)
            broker_commission = float(entry.broker_commission_amount or 0)
            subtotal += item_total
            total_cgst += cgst_amt
            total_sgst += sgst_amt
            total_broker_commission += broker_commission

            items.append({
                "product_name": product.product_name,
                "hsn_code": product.hsn_code or "",
                "quantity": entry.quantity,
                "unit": product.unit if hasattr(product, 'unit') else "N/A",
                "purchase_price": float(entry.purchase_price),
                "total_price": item_total,
                "cgst_percentage": cgst_pct,
                "cgst_amount": cgst_amt,
                "sgst_percentage": sgst_pct,
                "sgst_amount": sgst_amt,
                "mfg_date": format_date(entry.manufacture_date),
                "broker_name": entry.broker.broker_name if entry.broker else None,
                "broker_commission_rate": float(entry.broker_commission_rate or 0),
                "broker_commission_amount": broker_commission,
            })

        # Collect unique brokers across all items
        seen_broker_ids = set()
        brokers = []
        for entry in entries:
            if entry.broker and entry.broker.id not in seen_broker_ids:
                seen_broker_ids.add(entry.broker.id)
                brokers.append({
                    "name": entry.broker.broker_name,
                    "phone": entry.broker.phone_number or 'N/A',
                })

        grand_total = (
            subtotal + total_cgst + total_sgst
            + transporter_cost + varne_cost + labour_cost
            + total_broker_commission
        )

        context = {
            "invoice_number": invoice.invoice_number,
            "date": format_date(invoice.created_at.date()),
            "year": invoice.created_at.year,
            "vendor_name": vendor.vendor_name,
            "vendor_contact": vendor.contact_number or 'N/A',
            "vendor_email": vendor.email or 'N/A',
            "vendor_address": vendor.address or 'N/A',
            "vendor_gst": vendor.gst_number or 'N/A',
            "items": items,
            "subtotal": subtotal,
            "total_cgst": total_cgst,
            "total_sgst": total_sgst,
            "transporter_name": transporter_name,
            "transporter_contact": transporter_contact,
            "transporter_vehicle": transporter_vehicle,
            "transporter_cost": transporter_cost,
            "brokers": brokers,
            "varne_cost": varne_cost,
            "labour_cost": labour_cost,
            "total_broker_commission": total_broker_commission,
            "grand_total": grand_total,
            "user_name": f"{request.user.first_name} {request.user.last_name}".strip(),
        }

        html_string = render_to_string("vendor_invoice.html", context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_result = html.write_pdf()

        return pdf_result, invoice.invoice_number

class VendorInvoicePDFView(VendorInvoicePDFBaseView):
    """View PDF in browser"""
    def get(self, request, invoice_id):
        pdf_result, invoice_number = self.generate_pdf(request, invoice_id)
        if not pdf_result:
            return HttpResponse("No stock entries found for this invoice.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=invoice_{invoice_number}.pdf'
        response.write(pdf_result)
        return response

class VendorInvoicePDFDownloadView(VendorInvoicePDFBaseView):
    """Download PDF file"""
    def get(self, request, invoice_id):
        pdf_result, invoice_number = self.generate_pdf(request, invoice_id)
        if not pdf_result:
            return HttpResponse("No stock entries found for this invoice.", status=404)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=invoice_{invoice_number}.pdf'
        response.write(pdf_result)
        return response

class VendorInvoiceListView(APIView):
    """List all user's vendor invoices"""
    permission_classes = [IsAuthenticated, HasModuleAccess]
    required_permission = "view-vendor-invoices"
    
    def get(self, request):
        from rest_framework.pagination import PageNumberPagination
        from vendors.serializers import VendorInvoiceSerializer
        
        invoices = VendorInvoice.objects.filter(
            user=request.user
        ).select_related("vendor").order_by("created_at")

        paginator = PageNumberPagination()
        paginated_invoices = paginator.paginate_queryset(invoices, request)
        serializer = VendorInvoiceSerializer(paginated_invoices, many=True)
        return paginator.get_paginated_response(serializer.data)
