from rest_framework import serializers
from .models import Customer, AnimalType, CustomerAnimal


class AnimalTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnimalType
        fields = ["id", "name"]


class CustomerAnimalSerializer(serializers.ModelSerializer):
    animal_type_id = serializers.PrimaryKeyRelatedField(
        queryset=AnimalType.objects.all(), source='animal_type', write_only=True
    )
    animal_type = AnimalTypeSerializer(read_only=True)

    class Meta:
        model = CustomerAnimal
        fields = ["id", "animal_type", "animal_type_id", "count"]


class CustomerSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    animals = CustomerAnimalSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "user",
            "user_name",
            "first_name",
            "last_name",
            "email",
            "phone",
            "address",
            "village",
            "city",
            "state",
            "zip_code",
            "country",
            "date_of_birth",
            "gender",
            "num_of_animals",
            "type_of_customer",
            "milk_collection",
            "competitor_name",
            "competitor_mobile_number",
            "competitor_address",
            "customer_image",
            "animals",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "user_name",
            "animals",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return ""
