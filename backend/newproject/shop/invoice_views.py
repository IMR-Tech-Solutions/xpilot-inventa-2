from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.premissions import HasModuleAccess, IsOwnerOrAdmin
from .models import ShopOwnerOrders, ShopOrderItem
from django.utils.dateparse import parse_date
from accounts.models import UserMaster
from django.http import Http404

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
            order = ShopOwnerOrders.objects.get(id=order_id)
        except ShopOwnerOrders.DoesNotExist:
            raise Http404("Order not found")
        
        manager_items = order.order_items.filter(
            fulfilled_by_manager=request.user
            ).select_related('product')
    
        if not manager_items.exists():
            return None, None
        
        manager_items = order.order_items.filter(
            fulfilled_by_manager=request.user
        ).select_related('product')
        
        if not manager_items.exists():
            return None, None

        items = []
        total_amount = 0
        
        for item in manager_items:
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
            # Customer info (Shop Owner is customer from manager POV)
            "customer_name": f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
            "customer_phone": order.shop_owner.mobile_number or 'N/A',
            "customer_email": order.shop_owner.email or 'N/A',
            # Seller info (Manager)
            "seller_name": f"{request.user.first_name} {request.user.last_name}".strip(),
            "seller_phone": request.user.mobile_number or 'N/A',
            "seller_email": request.user.email or 'N/A',
            # Totals
            "subtotal": float(total_amount),
            "total_amount": float(total_amount),
            # Items
            "items": items,
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

class ManagerOrderDeliveryChallanPDFDownloadView(APIView):
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
            order = ShopOwnerOrders.objects.get(id=order_id)
        except ShopOwnerOrders.DoesNotExist:
            raise Http404("Order not found")
        
        manager_items = order.order_items.filter(
            fulfilled_by_manager=request.user
        ).select_related('product')
    
        if not manager_items.exists():
            return None, None

        items = []
        
        for item in manager_items:
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
            # Customer info (Shop Owner is customer from manager POV)
            "customer_name": f"{order.shop_owner.first_name} {order.shop_owner.last_name}".strip(),
            "customer_phone": order.shop_owner.mobile_number or 'N/A',
            "customer_email": order.shop_owner.email or 'N/A',
            # Seller info (Manager)
            "seller_name": f"{request.user.first_name} {request.user.last_name}".strip(),
            "seller_phone": request.user.mobile_number or 'N/A',
            "seller_email": request.user.email or 'N/A',
            # Items
            "items": items,
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
            ShopOwnerOrders,
            id=order_id,
            shop_owner=request.user
        )
        
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
            # Totals
            "subtotal": float(item_total),
            "total_amount": float(item_total),
            # Items
            "items": items,
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
