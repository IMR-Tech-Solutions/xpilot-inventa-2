from django.db import models
from django.utils import timezone
from products.models import Product
from vendors.models import Vendor, VendorInvoice
from accounts.models import UserMaster
from broker.models import Broker
from transport.models import Transporter


class StockEntry(models.Model):
    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='stock_entries')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='stock_entries')
    vendor_invoice = models.ForeignKey(
        VendorInvoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_entries'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_entries')

    quantity = models.PositiveIntegerField()
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)

    cgst_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0.00)
    cgst = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)
    sgst_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0.00)
    sgst = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)
    varne_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)
    labour_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)

    transporter = models.ForeignKey(
        Transporter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_entries'
    )
    transporter_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)

    broker = models.ForeignKey(
        Broker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_entries'
    )
    broker_commission_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)

    manufacture_date = models.DateField(default=timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.product_name} | Qty: {self.quantity} | Vendor: {self.vendor.vendor_name} | {self.created_at.date()}"
