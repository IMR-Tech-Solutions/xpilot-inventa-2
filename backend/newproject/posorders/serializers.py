from rest_framework import serializers
from django.db import transaction
from .models import POSOrder, POSOrderItem
from products.models import Product
from customers.models import Customer
from utils.inventory_service import InventoryService
from decimal import Decimal


class POSOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_sku = serializers.CharField(source='product.sku_code', read_only=True)

    class Meta:
        model = POSOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'total_price', 'notes'
        ]
        read_only_fields = ['id', 'total_price', 'product_name', 'product_sku']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

    def validate_product(self, value):
        if value.current_stock <= 0:
            raise serializers.ValidationError(f"Product '{value.product_name}' is out of stock")
        return value

    def validate_unit_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Unit price cannot be negative")
        return value


class POSOrderSerializer(serializers.ModelSerializer):
    order_items = POSOrderItemSerializer(many=True, write_only=True)
    order_items_details = POSOrderItemSerializer(source='order_items', many=True, read_only=True)
    customer_name = serializers.SerializerMethodField(read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)

    class Meta:
        model = POSOrder
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'customer_phone',
            'order_status', 'payment_status', 'payment_method',
            'address', 'city', 'zipcode',
            'subtotal', 'cgst_percentage', 'cgst_amount', 'sgst_percentage', 'sgst_amount',
            'discount_amount', 'labour_charges', 'transport_charges', 'total_amount',
            'amount_paid', 'remaining_amount', 'online_amount', 'offline_amount',
            'notes', 'order_items', 'order_items_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'cgst_amount', 'sgst_amount',
            'total_amount', 'remaining_amount',
            'address', 'city', 'zipcode', 'created_at', 'updated_at',
            'customer_name', 'customer_phone'
        ]

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"

    def validate_order_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        product_ids = [item['product'].id for item in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("Duplicate products are not allowed in the same order")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        payment_status = attrs.get('payment_status', 'pending')
        payment_method = attrs.get('payment_method')
        amount_paid = attrs.get('amount_paid', Decimal('0'))
        online_amount = attrs.get('online_amount', Decimal('0'))
        offline_amount = attrs.get('offline_amount', Decimal('0'))

        # Validate mix payment breakdown
        if payment_method == 'mix':
            if (online_amount or Decimal('0')) + (offline_amount or Decimal('0')) != (amount_paid or Decimal('0')):
                raise serializers.ValidationError(
                    "For mix payment, online_amount + offline_amount must equal amount_paid"
                )

        order_items_data = [
            {'product': item['product'], 'quantity': item['quantity']}
            for item in attrs.get('order_items', [])
        ]
        is_valid, error_messages = InventoryService.validate_order_items_stock(order_items_data, user)
        if not is_valid:
            raise serializers.ValidationError({'order_items': error_messages})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')
        user = self.context['request'].user

        order = POSOrder.objects.create(user=user, **validated_data)

        inventory_items = []
        order_items = []
        subtotal = Decimal('0.00')

        for item_data in order_items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            # Use sent unit_price, fallback to product selling_price, then 0
            unit_price = item_data.get('unit_price')
            if unit_price is None:
                unit_price = product.selling_price or Decimal('0.00')

            total_price = quantity * unit_price
            order_items.append(POSOrderItem(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                notes=item_data.get('notes', '')
            ))
            subtotal += total_price
            inventory_items.append({'product': product, 'quantity': quantity})

        success, messages, _ = InventoryService.process_order_inventory(inventory_items, user)
        if not success:
            raise serializers.ValidationError({'inventory': messages})

        POSOrderItem.objects.bulk_create(order_items)

        order.subtotal = subtotal
        order.cgst_amount = (subtotal * order.cgst_percentage) / Decimal('100')
        order.sgst_amount = (subtotal * order.sgst_percentage) / Decimal('100')
        order.total_amount = (
            subtotal
            + order.cgst_amount
            + order.sgst_amount
            + order.labour_charges
            + order.transport_charges
            - order.discount_amount
        )
        # Set remaining_amount based on payment_status
        if order.payment_status == 'paid':
            order.amount_paid = order.total_amount
            order.remaining_amount = Decimal('0')
        else:
            order.remaining_amount = max(Decimal('0'), order.total_amount - order.amount_paid)

        order.save()
        return order


class POSOrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSOrder
        fields = [
            'order_status', 'payment_status', 'payment_method',
            'amount_paid', 'online_amount', 'offline_amount', 'notes'
        ]

    def validate(self, attrs):
        payment_method = attrs.get('payment_method', self.instance.payment_method if self.instance else None)
        payment_status = attrs.get('payment_status', self.instance.payment_status if self.instance else 'pending')
        amount_paid = attrs.get('amount_paid', self.instance.amount_paid if self.instance else Decimal('0'))
        online_amount = attrs.get('online_amount', self.instance.online_amount if self.instance else Decimal('0'))
        offline_amount = attrs.get('offline_amount', self.instance.offline_amount if self.instance else Decimal('0'))

        if payment_method == 'mix' and payment_status in ('paid', 'partial'):
            if (online_amount or Decimal('0')) + (offline_amount or Decimal('0')) != (amount_paid or Decimal('0')):
                raise serializers.ValidationError(
                    "For mix payment, online_amount + offline_amount must equal amount_paid"
                )
        return attrs

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Auto-resolve when paid
        if instance.payment_status == 'paid':
            instance.amount_paid = instance.total_amount
            instance.remaining_amount = Decimal('0')
        else:
            instance.remaining_amount = max(Decimal('0'), instance.total_amount - instance.amount_paid)
        instance.save()
        return instance


class POSOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField(read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    items_count = serializers.IntegerField(source='order_items.count', read_only=True)

    class Meta:
        model = POSOrder
        fields = [
            'id', 'order_number', 'customer_name', 'customer_phone',
            'order_status', 'payment_status', 'payment_method',
            'total_amount', 'amount_paid', 'remaining_amount',
            'items_count', 'created_at'
        ]

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"


# Shop order serializers (kept for shop-owner flow, original_stock_batch removed)
class POSShopOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_sku = serializers.CharField(source='product.sku_code', read_only=True)

    class Meta:
        model = POSOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'total_price', 'notes'
        ]
        read_only_fields = ['id', 'total_price', 'product_name', 'product_sku']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value


class POSShopOrderSerializer(serializers.ModelSerializer):
    order_items = POSShopOrderItemSerializer(many=True, write_only=True)
    order_items_details = POSShopOrderItemSerializer(source='order_items', many=True, read_only=True)
    customer_name = serializers.SerializerMethodField(read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)

    class Meta:
        model = POSOrder
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'customer_phone',
            'order_status', 'payment_status', 'payment_method',
            'address', 'city', 'zipcode',
            'subtotal', 'cgst_percentage', 'cgst_amount', 'sgst_percentage', 'sgst_amount',
            'discount_amount', 'labour_charges', 'transport_charges', 'total_amount',
            'amount_paid', 'remaining_amount', 'online_amount', 'offline_amount',
            'notes', 'order_items', 'order_items_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'cgst_amount', 'sgst_amount',
            'total_amount', 'remaining_amount',
            'address', 'city', 'zipcode', 'created_at', 'updated_at',
            'customer_name', 'customer_phone'
        ]

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"

    def validate_order_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        product_ids = [item['product'].id for item in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("Duplicate products are not allowed in the same order")
        return value

    @transaction.atomic
    def create(self, validated_data):
        from shop.models import ShopOwnerProducts
        order_items_data = validated_data.pop('order_items')
        user = self.context['request'].user

        order = POSOrder.objects.create(user=user, **validated_data)
        order_items = []
        subtotal = Decimal('0.00')

        for item_data in order_items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            try:
                shop_product = ShopOwnerProducts.objects.get(product=product, shop_owner=user)
                unit_price = item_data.get('unit_price') or shop_product.selling_price
                if shop_product.quantity < quantity:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {product.product_name}. Available: {shop_product.quantity}"
                    )
            except ShopOwnerProducts.DoesNotExist:
                raise serializers.ValidationError(f"Product {product.product_name} not found in your inventory")

            total_price = quantity * unit_price
            order_items.append(POSOrderItem(
                order=order, product=product, quantity=quantity,
                unit_price=unit_price, total_price=total_price,
                notes=item_data.get('notes', '')
            ))
            subtotal += total_price

        # Reduce shop stock
        for item_data in order_items_data:
            shop_product = ShopOwnerProducts.objects.get(shop_owner=user, product=item_data['product'])
            shop_product.quantity -= item_data['quantity']
            shop_product.save()

        POSOrderItem.objects.bulk_create(order_items)

        order.subtotal = subtotal
        order.cgst_amount = (subtotal * order.cgst_percentage) / Decimal('100')
        order.sgst_amount = (subtotal * order.sgst_percentage) / Decimal('100')
        order.total_amount = (
            subtotal + order.cgst_amount + order.sgst_amount
            + order.labour_charges + order.transport_charges - order.discount_amount
        )
        if order.payment_status == 'paid':
            order.amount_paid = order.total_amount
            order.remaining_amount = Decimal('0')
        else:
            order.remaining_amount = max(Decimal('0'), order.total_amount - order.amount_paid)
        order.save()
        return order
