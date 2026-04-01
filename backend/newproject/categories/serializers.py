from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = ["id", "user","user_name","category_name", "category_image"]
        read_only_fields = ["id", "user","user_name"] 

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return ""
    
class CategoryBulkCreateSerializer(serializers.ListSerializer):
    def create(self, validated_data):
        user = self.context['request'].user
        category_objects = [Category(user=user, **item) for item in validated_data]
        return Category.objects.bulk_create(category_objects)

class CategoryBulkSerializer(CategorySerializer):
    class Meta(CategorySerializer.Meta):
        list_serializer_class = CategoryBulkCreateSerializer