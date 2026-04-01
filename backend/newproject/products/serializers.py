from rest_framework import serializers
from .models import Product, ProductUnit
from categories.models import Category

class ProductSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    unit_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "user",
            "user_name",
            "category",
            "category_name",
            "product_name",
            "product_image",
            "sku_code",
            "description",
            "unit",
            "unit_name",
            "selling_price",
            "current_stock",
            "low_stock_threshold",
            "is_live",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "user_name", "category_name", "unit_name", "current_stock", "created_at", "updated_at"]

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return ""

    def get_category_name(self, obj):
        if obj.category:
            return obj.category.category_name
        return ""

    def get_unit_name(self, obj):
        if obj.unit and hasattr(obj.unit, 'unitName'):
            return obj.unit.unitName
        return ""

    def validate(self, data):
        user = self.instance.user if self.instance else self.context['request'].user
        sku_code = data.get('sku_code')
        if sku_code:
            qs = Product.objects.filter(user=user, sku_code=sku_code)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'sku_code': 'SKU code must be unique per user.'})
        return data
    
class ProductBulkCreateSerializer(serializers.ListSerializer):
    def create(self, validated_data):
        user = self.context['request'].user
        product_objects = [Product(user=user, **item) for item in validated_data]
        return Product.objects.bulk_create(product_objects)

class ProductBulkSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        list_serializer_class = ProductBulkCreateSerializer


class ProductUnitSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductUnit
        fields = ['id', 'user', 'user_name', 'unitName']
        read_only_fields = ['id', 'user', 'user_name']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else ""