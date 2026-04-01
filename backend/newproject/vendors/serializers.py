from rest_framework import serializers
from .models import Vendor, VendorInvoice


class VendorSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'user_name')
        extra_kwargs = {
            'vendor_name': {'required': True},
            'contact_person': {'required': False, 'allow_blank': True, 'allow_null': True},
            'contact_number': {'required': True},
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
            'gst_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'pan_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'registration_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'address': {'required': False, 'allow_blank': True, 'allow_null': True},
            'state': {'required': False, 'allow_blank': True, 'allow_null': True},
            'city': {'required': False, 'allow_blank': True, 'allow_null': True},
            'postal_code': {'required': False, 'allow_blank': True, 'allow_null': True},
            'bank_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'account_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'ifsc_code': {'required': False, 'allow_blank': True, 'allow_null': True},
            'upi_id': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return ""

    def validate(self, data):
        user = self.instance.user if self.instance else self.context['request'].user

        # Convert empty strings to None
        for field in list(data.keys()):
            if isinstance(data[field], str) and data[field].strip() == '':
                data[field] = None

        # Required field check after empty string conversion
        for field in ['vendor_name', 'contact_number']:
            if not self.instance and not data.get(field):
                raise serializers.ValidationError({field: f'{field.replace("_", " ").title()} is required.'})

        # Uniqueness check for contact_number and email only
        for field in ['contact_number', 'email']:
            self._validate_unique_field(field, data, user)

        return data

    def _validate_unique_field(self, field_name, data, user):
        value = data.get(field_name)
        if self.instance and field_name not in data:
            value = getattr(self.instance, field_name, None)
        if not value:
            return
        qs = Vendor.objects.filter(**{field_name: value, 'user': user})
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                field_name: f"{field_name.replace('_', ' ').title()} already exists for this user."
            })

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class VendorInvoiceSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = VendorInvoice
        fields = ['id', 'invoice_number', 'created_at', 'vendor_name', 'total_amount', 'items_count']

    def get_items_count(self, obj):
        return obj.stock_entries.count()


class VendorInvoiceDetailSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    vendor_contact = serializers.CharField(source='vendor.contact_number', read_only=True)
    vendor_email = serializers.CharField(source='vendor.email', read_only=True)
    vendor_address = serializers.CharField(source='vendor.address', read_only=True)

    class Meta:
        model = VendorInvoice
        fields = [
            'id', 'invoice_number', 'created_at', 'vendor_name',
            'vendor_contact', 'vendor_email', 'vendor_address', 'total_amount'
        ]
