from django.db import models
from django.utils import timezone
from accounts.models import UserMaster
from products.models import Product


def generate_shop_order_number():
    current_year = timezone.now().year
    last_order = ShopOwnerOrders.objects.filter(
        order_number__startswith=f'SO-{current_year}-'
    ).order_by('-order_number').first()
    
    if last_order:
        last_sequence = int(last_order.order_number.split('-')[-1])
        new_sequence = last_sequence + 1
    else:
        new_sequence = 1
    return f'SO-{current_year}-{new_sequence:03d}'


class ShopOwnerProducts(models.Model):
    shop_owner = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='shop_owned_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2) 
    selling_price =  models.DecimalField(max_digits=10, decimal_places=2) 
    is_active = models.BooleanField(default=True)
    delivery_confirmed = models.BooleanField(default=False)
    source_manager = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='products_sold_to_shop_owners')
    purchase_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['shop_owner', 'product'], name='unique_shop_owner_product')
        ]
        indexes = [
            models.Index(fields=['shop_owner', 'product']),
            models.Index(fields=['source_manager']),
        ]
    
    def __str__(self):
        return f"{self.shop_owner.first_name} - {self.product.product_name} ({self.quantity})"


class ShopOwnerOrders(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('order_placed', 'Order Placed'),
        ('partially_fulfilled', 'Partially Fulfilled'),
        ('delivery_in_progress', 'Delivery in Progress'),
        ('packing', 'Packing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('online', 'Online'),
        ('mix', 'Mix'),
    ]
    order_number = models.CharField(max_length=20, unique=True, default=generate_shop_order_number)
    shop_owner = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='shop_orders')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # ── Payment tracking (set by manager/admin after delivery confirmed) ──────
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    online_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    offline_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(null=True, blank=True)
    # Delivery / transporter details (set when status → delivery_in_progress)
    delivery_transporter = models.ForeignKey(
        'transport.Transporter', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='shop_deliveries'
    )
    delivery_from = models.CharField(max_length=200, null=True, blank=True)
    delivery_to = models.CharField(max_length=200, null=True, blank=True)
    delivery_transporter_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shop_owner', 'status']),
            models.Index(fields=['order_number']),
        ]
    
    def __str__(self):
        return f"Order {self.order_number} by {self.shop_owner.first_name}"


class ShopPaymentTransaction(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('online', 'Online'),
        ('mix', 'Mix'),
    ]
    order = models.ForeignKey(ShopOwnerOrders, on_delete=models.CASCADE, related_name='payment_transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    online_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    offline_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    previous_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    manager = models.ForeignKey(UserMaster, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_shop_payments')
    recorded_by = models.ForeignKey(UserMaster, on_delete=models.SET_NULL, null=True, blank=True, related_name='shop_payment_transactions')
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Receipt #{self.id} - {self.order.order_number} - ₹{self.amount}"


class ShopOrderItem(models.Model):
    MANAGER_STATUS_CHOICES = [
        ('order_placed', 'Order Placed'),
        ('packing', 'Packing'),
        ('delivery_in_progress', 'Delivery in Progress'),
        ('cancelled', 'Cancelled'),
    ]

    order = models.ForeignKey(ShopOwnerOrders, on_delete=models.CASCADE, related_name='order_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    requested_quantity = models.PositiveIntegerField()
    expected_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fulfilled_by_manager = models.ForeignKey(UserMaster, on_delete=models.CASCADE, null=True, blank=True, related_name='fulfilled_shop_orders')
    fulfilled_quantity = models.PositiveIntegerField(null=True, blank=True)
    actual_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # Per-manager status and delivery details — isolates each manager's progress
    manager_status = models.CharField(max_length=30, choices=MANAGER_STATUS_CHOICES, null=True, blank=True)
    item_delivery_transporter = models.ForeignKey(
        'transport.Transporter', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='item_deliveries'
    )
    item_delivery_from = models.CharField(max_length=200, null=True, blank=True)
    item_delivery_to = models.CharField(max_length=200, null=True, blank=True)
    item_delivery_transporter_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['order', 'product'], name='unique_product_per_shop_order')
        ]
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product.product_name} x{self.requested_quantity}"


class ManagerRequest(models.Model):
    REQUEST_STATUS_CHOICES = [
        ('pending', 'Pending'),      
        ('accepted', 'Accepted'),   
        ('fulfilled', 'Fulfilled'), 
        ('rejected', 'Rejected'),   
        ('cancelled', 'Cancelled'),  
    ]
    
    order_item = models.ForeignKey(ShopOrderItem, on_delete=models.CASCADE, related_name='manager_requests')
    manager = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='shop_requests')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    requested_quantity = models.PositiveIntegerField()
    offered_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default='pending')

    manager_response_notes = models.TextField(null=True, blank=True)
    response_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['manager', 'status']),
            models.Index(fields=['order_item', 'status']),
        ]
    
    def __str__(self):
        return f"Request to {self.manager.first_name} for {self.product.product_name}"


# ── Shop-to-Shop (S2S) Models ─────────────────────────────────────────────────

def generate_s2s_order_number():
    current_year = timezone.now().year
    last_order = S2SOrder.objects.filter(
        order_number__startswith=f'S2S-{current_year}-'
    ).order_by('-order_number').first()
    if last_order:
        last_seq = int(last_order.order_number.split('-')[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1
    return f'S2S-{current_year}-{new_seq:03d}'


class S2SOrder(models.Model):
    STATUS_CHOICES = [
        ('order_placed', 'Order Placed'),
        ('partially_accepted', 'Partially Accepted'),
        ('accepted', 'Accepted'),
        ('packing', 'Packing'),
        ('delivery_in_progress', 'Delivery in Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('online', 'Online'),
        ('mix', 'Mix'),
    ]

    order_number = models.CharField(max_length=20, unique=True, default=generate_s2s_order_number)
    buyer = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='s2s_purchases')
    seller = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='s2s_sales')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='order_placed')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(null=True, blank=True)
    delivery_transporter = models.ForeignKey(
        'transport.Transporter', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='s2s_deliveries'
    )
    delivery_from = models.CharField(max_length=200, null=True, blank=True)
    delivery_to = models.CharField(max_length=200, null=True, blank=True)
    delivery_transporter_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['seller', 'status']),
        ]

    def __str__(self):
        return f"S2S {self.order_number}: {self.buyer.first_name} → {self.seller.first_name}"


class S2SOrderItem(models.Model):
    ITEM_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    order = models.ForeignKey(S2SOrder, on_delete=models.CASCADE, related_name='order_items')
    seller_product = models.ForeignKey(ShopOwnerProducts, on_delete=models.CASCADE, related_name='s2s_order_items')
    requested_quantity = models.PositiveIntegerField()
    fulfilled_quantity = models.PositiveIntegerField(null=True, blank=True)
    actual_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_status = models.CharField(max_length=20, choices=ITEM_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.seller_product.product.product_name}"


class S2SPaymentTransaction(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('online', 'Online'),
        ('mix', 'Mix'),
    ]

    order = models.ForeignKey(S2SOrder, on_delete=models.CASCADE, related_name='payment_transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    online_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    offline_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    previous_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    recorded_by = models.ForeignKey(UserMaster, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_s2s_payments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"S2S Receipt #{self.id} - {self.order.order_number} - ₹{self.amount}"

