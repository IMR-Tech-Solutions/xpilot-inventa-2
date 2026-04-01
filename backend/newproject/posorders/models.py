from django.db import models
from django.utils import timezone
from accounts.models import UserMaster
from customers.models import Customer
from products.models import Product

def generate_pos_order_number():
    current_year = timezone.now().year
    last_order = POSOrder.objects.filter(
        order_number__startswith=f'POS-{current_year}-'
    ).order_by('-order_number').first()

    if last_order:
        last_sequence = int(last_order.order_number.split('-')[-1])
        new_sequence = last_sequence + 1
    else:
        new_sequence = 1
    return f'POS-{current_year}-{new_sequence:03d}'

class POSOrder(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Pickup'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partial', 'Partial'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit', 'Credit'),
        ('mix', 'Mix'),
    ]

    # Core fields
    order_number = models.CharField(max_length=20, unique=True, default=generate_pos_order_number)
    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='pos_orders')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='pos_orders')

    # Order / Payment status
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)

    # Address fields
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    zipcode = models.CharField(max_length=20, null=True, blank=True)

    # Financial fields
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cgst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sgst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labour_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transport_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Partial payment tracking
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Mix payment breakdown
    online_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    offline_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Additional fields
    notes = models.TextField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'order_status']),
            models.Index(fields=['customer', 'created_at']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.customer.first_name} {self.customer.last_name}"

    def populate_address_from_customer(self):
        if self.customer:
            self.address = self.customer.address
            self.city = self.customer.city
            self.zipcode = self.customer.zip_code

    def save(self, *args, **kwargs):
        if not self.address and self.customer_id:
            try:
                self.populate_address_from_customer()
            except Exception:
                pass

        if not self.order_number:
            self.order_number = generate_pos_order_number()

        # Calculate tax amounts from percentages
        if self.subtotal:
            from decimal import Decimal
            self.cgst_amount = (self.subtotal * self.cgst_percentage) / Decimal('100')
            self.sgst_amount = (self.subtotal * self.sgst_percentage) / Decimal('100')

        # Auto-resolve remaining when fully paid
        if self.payment_status == 'paid':
            self.amount_paid = self.total_amount
            self.remaining_amount = 0
        else:
            from decimal import Decimal
            self.remaining_amount = max(Decimal('0'), self.total_amount - self.amount_paid)

        super().save(*args, **kwargs)


class POSOrderItem(models.Model):
    order = models.ForeignKey(POSOrder, on_delete=models.CASCADE, related_name='order_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['order', 'product'], name='unique_product_per_pos_order')
        ]

    def __str__(self):
        return f"{self.order.order_number} - {self.product.product_name} x{self.quantity}"

    def save(self, *args, **kwargs):
        if self.unit_price is not None and self.quantity is not None:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
