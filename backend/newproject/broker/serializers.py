from rest_framework import serializers
from .models import Broker


class BrokerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Broker
        fields = [
            'id', 'broker_name', 'contact_person', 'phone_number', 'email',
            'address', 'city', 'state', 'postal_code', 'pan_number', 'gst_number',
            'license_number', 'default_commission_amount', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']
        extra_kwargs = {
            'broker_name': {'required': True},
            'contact_person': {'required': False, 'allow_blank': True, 'allow_null': True},
            'phone_number': {'required': True},
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
            'address': {'required': False, 'allow_blank': True, 'allow_null': True},
            'city': {'required': False, 'allow_blank': True, 'allow_null': True},
            'state': {'required': False, 'allow_blank': True, 'allow_null': True},
            'postal_code': {'required': False, 'allow_blank': True, 'allow_null': True},
            'pan_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'gst_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            'license_number': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate_default_commission_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Commission cannot be negative")
        return value

    def validate(self, data):
        # Convert empty strings to None
        for field in list(data.keys()):
            if isinstance(data[field], str) and data[field].strip() == '':
                data[field] = None
        
        # Required field check after empty string conversion
        for field in ['broker_name', 'phone_number']:
            if not self.instance and not data.get(field):
                raise serializers.ValidationError({field: f'{field.replace("_", " ").title()} is required.'})

        user = self.instance.created_by if self.instance else self.context['request'].user

        # Uniqueness check for phone_number and email only
        for field in ['phone_number', 'email']:
            self._validate_unique_field(field, data, user)

        return data

    def _validate_unique_field(self, field_name, data, user):
        value = data.get(field_name)
        if self.instance and field_name not in data:
            value = getattr(self.instance, field_name, None)
        if not value:
            return
        qs = Broker.objects.filter(**{field_name: value, 'created_by': user})
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                field_name: f"{field_name.replace('_', ' ').title()} already exists."
            })

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class BrokerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Broker
        fields = ['id', 'broker_name', 'contact_person', 'phone_number', 'default_commission_amount', 'is_active']
