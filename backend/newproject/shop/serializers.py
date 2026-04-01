from rest_framework import serializers
from django.db import transaction
from .models import ShopOwnerOrders, ShopOrderItem, ManagerRequest, ShopOwnerProducts
from products.models import Product

class ShopOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_sku = serializers.CharField(source='product.sku_code', read_only=True)
    class Meta:
        model = ShopOrderItem
        fields = [
            'product', 'product_name', 'product_sku', 
            'requested_quantity', 'expected_price'
        ]
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value
    
    def validate_product(self, value):
        if value.current_stock <= 0:
            raise serializers.ValidationError(f"Product '{value.product_name}' is not available in any manager's inventory")
        return value

class ShopOwnerOrderSerializer(serializers.ModelSerializer):
    order_items = ShopOrderItemSerializer(many=True, write_only=True)
    order_items_details = ShopOrderItemSerializer(source='order_items', many=True, read_only=True)
    shop_owner_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ShopOwnerOrders
        fields = [
            'id', 'order_number', 'shop_owner_name', 'status',
            'total_amount', 'notes', 'order_items', 'order_items_details',
            'created_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'total_amount', 'shop_owner_name',
            'created_at'
        ]
    
    def get_shop_owner_name(self, obj):
        return f"{obj.shop_owner.first_name} {obj.shop_owner.last_name}"
    
    def validate_order_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        
        # Check for duplicate products
        product_ids = [item['product'].id for item in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("Duplicate products are not allowed in the same order")
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')
        shop_owner = self.context['request'].user
        
        # Create the shop owner order
        order = ShopOwnerOrders.objects.create(shop_owner=shop_owner, **validated_data)
        
        # Create order items and calculate total
        total_amount = 0
        for item_data in order_items_data:
            order_item = ShopOrderItem.objects.create(order=order, **item_data)
            if item_data.get('expected_price'):
                total_amount += item_data['expected_price'] * item_data['requested_quantity']
        
        # Update order total and status
        order.total_amount = total_amount
        order.status = 'order_placed'
        order.save()
        
        return order

class ShopOrderListSerializer(serializers.ModelSerializer):
    shop_owner_name = serializers.SerializerMethodField(read_only=True)
    items_count = serializers.IntegerField(source='order_items.count', read_only=True)
    
    class Meta:
        model = ShopOwnerOrders
        fields = [
            'id', 'order_number', 'shop_owner_name', 'status',
            'total_amount', 'items_count', 'created_at'
        ]
    
    def get_shop_owner_name(self, obj):
        return f"{obj.shop_owner.first_name} {obj.shop_owner.last_name}"
    

class ManagerRequestSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_sku = serializers.CharField(source='product.sku_code', read_only=True)
    shop_owner_name = serializers.SerializerMethodField(read_only=True)
    order_number = serializers.CharField(source='order_item.order.order_number', read_only=True)
    
    class Meta:
        model = ManagerRequest
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'requested_quantity', 'offered_price', 'status',
            'shop_owner_name', 'order_number',
            'manager_response_notes', 'response_date',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_shop_owner_name(self, obj):
        return f"{obj.order_item.order.shop_owner.first_name} {obj.order_item.order.shop_owner.last_name}"

class ManagerRequestListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    shop_owner_name = serializers.SerializerMethodField(read_only=True)
    order_number = serializers.CharField(source='order_item.order.order_number', read_only=True)
    
    class Meta:
        model = ManagerRequest
        fields = [
            'id', 'product_name', 'requested_quantity', 
            'offered_price', 'status', 'shop_owner_name',
            'order_number', 'created_at'
        ]
    
    def get_shop_owner_name(self, obj):
        return f"{obj.order_item.order.shop_owner.first_name} {obj.order_item.order.shop_owner.last_name}"

class ShopOwnerProductsSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_image = serializers.ImageField(source='product.product_image', read_only=True)
    product_sku = serializers.CharField(source='product.sku_code', read_only=True)
    category_name = serializers.CharField(source='product.category.category_name', read_only=True)
    source_manager_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ShopOwnerProducts
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'product_image', 'category_name',
            'quantity','purchase_price', 'selling_price',
            'source_manager_name', 'purchase_date','is_active', 'delivery_confirmed' 
        ]
    
    def get_source_manager_name(self, obj):
        return f"{obj.source_manager.first_name} {obj.source_manager.last_name}"
    