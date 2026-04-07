from rest_framework import serializers
from .models import StockEntry
from vendors.models import Vendor, VendorInvoice
from products.models import Product
from broker.models import Broker
from transport.models import Transporter
from django.db import transaction
from django.db.models import F
from decimal import Decimal


def _owned_by(obj, user):
    """Return True if obj belongs to user. Vendor/Transporter use .user, Broker uses .created_by."""
    if hasattr(obj, 'created_by'):
        return obj.created_by == user
    return obj.user == user


# ── Per-item serializer (used inside bulk) ───────────────────────────────────
class StockItemSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    purchase_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    cgst_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0)
    sgst_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0)
    manufacture_date = serializers.DateField(required=False, allow_null=True)

    def validate_purchase_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Purchase price must be greater than 0.")
        return value


# ── Bulk create serializer ────────────────────────────────────────────────────
class BulkStockEntrySerializer(serializers.Serializer):
    vendor = serializers.PrimaryKeyRelatedField(queryset=Vendor.objects.all())
    transporter = serializers.PrimaryKeyRelatedField(
        queryset=Transporter.objects.all(), required=False, allow_null=True
    )
    transporter_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=0
    )
    varne_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=0
    )
    labour_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=0
    )
    broker = serializers.PrimaryKeyRelatedField(
        queryset=Broker.objects.all(), required=False, allow_null=True
    )
    broker_commission_rate = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=0,
        help_text="Rate per bag/unit (e.g. 5 for ₹5/bag)"
    )
    items = StockItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user

        vendor = attrs.get('vendor')
        if vendor and not _owned_by(vendor, user):
            raise serializers.ValidationError({'vendor': 'Invalid vendor.'})

        transporter = attrs.get('transporter')
        if transporter and not _owned_by(transporter, user):
            raise serializers.ValidationError({'transporter': 'Invalid transporter.'})

        broker = attrs.get('broker')
        if broker and not _owned_by(broker, user):
            raise serializers.ValidationError({'broker': 'Invalid broker.'})

        for item in attrs.get('items', []):
            product = item['product']
            if product.user != user:
                raise serializers.ValidationError(
                    {'items': f"Product '{product.product_name}' does not belong to you."}
                )

        for field in ['transporter_cost', 'varne_cost', 'labour_cost', 'broker_commission_rate']:
            val = attrs.get(field)
            if val is not None and val < 0:
                raise serializers.ValidationError({field: f'{field} cannot be negative.'})

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        vendor = validated_data['vendor']
        transporter = validated_data.get('transporter')
        transporter_cost = validated_data.get('transporter_cost', Decimal('0'))
        varne_cost = validated_data.get('varne_cost', Decimal('0'))
        labour_cost = validated_data.get('labour_cost', Decimal('0'))
        broker = validated_data.get('broker')
        broker_commission_rate = validated_data.get('broker_commission_rate', Decimal('0'))
        items = validated_data['items']

        with transaction.atomic():
            # One invoice for all items
            total_amount = sum(
                item['purchase_price'] * Decimal(str(item['quantity']))
                for item in items
            )
            vendor_invoice = VendorInvoice.objects.create(
                user=user,
                vendor=vendor,
                total_amount=total_amount,
            )

            created_entries = []
            for item in items:
                product = item['product']
                quantity = item['quantity']
                purchase_price = item['purchase_price']
                cgst_pct = item.get('cgst_percentage', Decimal('0')) or Decimal('0')
                sgst_pct = item.get('sgst_percentage', Decimal('0')) or Decimal('0')
                cgst_amount = (purchase_price * cgst_pct / Decimal('100')).quantize(Decimal('0.01'))
                sgst_amount = (purchase_price * sgst_pct / Decimal('100')).quantize(Decimal('0.01'))

                commission_amount = (broker_commission_rate * Decimal(str(quantity))).quantize(Decimal('0.01'))

                entry = StockEntry.objects.create(
                    user=user,
                    vendor=vendor,
                    vendor_invoice=vendor_invoice,
                    product=product,
                    quantity=quantity,
                    purchase_price=purchase_price,
                    cgst_percentage=cgst_pct,
                    cgst=cgst_amount,
                    sgst_percentage=sgst_pct,
                    sgst=sgst_amount,
                    varne_cost=varne_cost,
                    labour_cost=labour_cost,
                    transporter=transporter,
                    transporter_cost=transporter_cost,
                    broker=broker,
                    broker_commission_rate=broker_commission_rate,
                    broker_commission_amount=commission_amount,
                    manufacture_date=item.get('manufacture_date'),
                )
                created_entries.append(entry)

                # Increment product current_stock atomically
                Product.objects.filter(pk=product.pk).update(
                    current_stock=F('current_stock') + quantity
                )

        return vendor_invoice, created_entries


# ── Single entry create (kept for direct single-entry use) ───────────────────
class StockEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockEntry
        fields = [
            'vendor', 'product', 'quantity', 'purchase_price',
            'cgst_percentage', 'cgst', 'sgst_percentage', 'sgst',
            'varne_cost', 'labour_cost',
            'transporter', 'transporter_cost',
            'broker', 'broker_commission_amount',
            'manufacture_date',
        ]
        extra_kwargs = {
            'vendor': {'required': True},
            'product': {'required': True},
            'quantity': {'required': True},
            'purchase_price': {'required': True},
        }

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate_purchase_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Purchase price must be greater than 0.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user

        vendor = attrs.get('vendor')
        if vendor and not _owned_by(vendor, user):
            raise serializers.ValidationError({'vendor': 'Invalid vendor.'})

        product = attrs.get('product')
        if product and product.user != user:
            raise serializers.ValidationError({'product': 'Invalid product.'})

        transporter = attrs.get('transporter')
        if transporter and not _owned_by(transporter, user):
            raise serializers.ValidationError({'transporter': 'Invalid transporter.'})

        broker = attrs.get('broker')
        if broker and not _owned_by(broker, user):
            raise serializers.ValidationError({'broker': 'Invalid broker.'})

        for field in ['cgst_percentage', 'cgst', 'sgst_percentage', 'sgst', 'varne_cost', 'labour_cost', 'transporter_cost', 'broker_commission_amount']:
            val = attrs.get(field)
            if val is not None and val < 0:
                raise serializers.ValidationError({field: f'{field} cannot be negative.'})

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        vendor = validated_data['vendor']
        product = validated_data['product']
        quantity = validated_data['quantity']
        purchase_price = validated_data['purchase_price']
        cgst_pct = validated_data.get('cgst_percentage', Decimal('0')) or Decimal('0')
        sgst_pct = validated_data.get('sgst_percentage', Decimal('0')) or Decimal('0')
        validated_data['cgst'] = (purchase_price * cgst_pct / Decimal('100')).quantize(Decimal('0.01'))
        validated_data['sgst'] = (purchase_price * sgst_pct / Decimal('100')).quantize(Decimal('0.01'))

        with transaction.atomic():
            total_amount = purchase_price * Decimal(str(quantity))
            vendor_invoice = VendorInvoice.objects.create(
                user=user,
                vendor=vendor,
                total_amount=total_amount,
            )

            entry = StockEntry.objects.create(
                user=user,
                vendor_invoice=vendor_invoice,
                **validated_data,
            )

            Product.objects.filter(pk=product.pk).update(
                current_stock=F('current_stock') + quantity
            )

        return entry


# ── Read serializers ──────────────────────────────────────────────────────────
class StockEntryListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    broker_name = serializers.CharField(source='broker.broker_name', read_only=True)
    transporter_name = serializers.CharField(source='transporter.transporter_name', read_only=True)
    invoice_number = serializers.CharField(source='vendor_invoice.invoice_number', read_only=True)
    tonnes = serializers.SerializerMethodField()

    class Meta:
        model = StockEntry
        fields = [
            'id', 'product', 'product_name', 'vendor', 'vendor_name',
            'quantity', 'tonnes', 'purchase_price', 'broker', 'broker_name',
            'broker_commission_rate', 'broker_commission_amount',
            'transporter', 'transporter_name', 'invoice_number',
            'manufacture_date', 'created_at',
        ]

    def get_tonnes(self, obj):
        try:
            weight_kg = obj.product.unit.weight_kg if obj.product and obj.product.unit else None
            if weight_kg and weight_kg > 0:
                return round(float(obj.quantity * weight_kg) / 1000, 4)
        except Exception:
            pass
        return None


class StockEntryDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.vendor_name', read_only=True)
    broker_name = serializers.CharField(source='broker.broker_name', read_only=True)
    transporter_name = serializers.CharField(source='transporter.transporter_name', read_only=True)
    invoice_number = serializers.CharField(source='vendor_invoice.invoice_number', read_only=True)
    tonnes = serializers.SerializerMethodField()

    class Meta:
        model = StockEntry
        fields = [
            'id', 'product', 'product_name', 'vendor', 'vendor_name',
            'vendor_invoice', 'invoice_number',
            'quantity', 'tonnes', 'purchase_price',
            'cgst_percentage', 'cgst', 'sgst_percentage', 'sgst',
            'varne_cost', 'labour_cost',
            'transporter', 'transporter_name', 'transporter_cost',
            'broker', 'broker_name', 'broker_commission_rate', 'broker_commission_amount',
            'manufacture_date', 'created_at',
        ]

    def get_tonnes(self, obj):
        try:
            weight_kg = obj.product.unit.weight_kg if obj.product and obj.product.unit else None
            if weight_kg and weight_kg > 0:
                return round(float(obj.quantity * weight_kg) / 1000, 4)
        except Exception:
            pass
        return None


class StockEntryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockEntry
        fields = [
            'cgst_percentage', 'cgst', 'sgst_percentage', 'sgst',
            'varne_cost', 'labour_cost',
            'transporter', 'transporter_cost',
            'broker', 'broker_commission_rate', 'broker_commission_amount',
            'manufacture_date',
        ]

    def validate(self, attrs):
        for field in ['cgst_percentage', 'cgst', 'sgst_percentage', 'sgst',
                      'varne_cost', 'labour_cost', 'transporter_cost',
                      'broker_commission_rate', 'broker_commission_amount']:
            val = attrs.get(field)
            if val is not None and val < 0:
                raise serializers.ValidationError({field: f'{field} cannot be negative.'})
        return attrs

    def update(self, instance, validated_data):
        purchase_price = instance.purchase_price
        if 'cgst_percentage' in validated_data:
            cgst_pct = validated_data['cgst_percentage'] or Decimal('0')
            validated_data['cgst'] = (purchase_price * cgst_pct / Decimal('100')).quantize(Decimal('0.01'))
        if 'sgst_percentage' in validated_data:
            sgst_pct = validated_data['sgst_percentage'] or Decimal('0')
            validated_data['sgst'] = (purchase_price * sgst_pct / Decimal('100')).quantize(Decimal('0.01'))
        # Recalculate commission amount if rate changed
        if 'broker_commission_rate' in validated_data:
            rate = validated_data['broker_commission_rate'] or Decimal('0')
            validated_data['broker_commission_amount'] = (rate * Decimal(str(instance.quantity))).quantize(Decimal('0.01'))
        return super().update(instance, validated_data)
