from django.db import models
from accounts.models import UserMaster


class Broker(models.Model):
    broker_name = models.CharField(max_length=100, null=True, blank=True)
    contact_person = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=17, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=50, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    pan_number = models.CharField(max_length=10, null=True, blank=True)
    gst_number = models.CharField(max_length=15, null=True, blank=True)
    license_number = models.CharField(max_length=50, null=True, blank=True)
    default_commission_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Default commission per unit (e.g., 4 for ₹4 per bag)"
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name='created_brokers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['broker_name']
        indexes = [
            models.Index(fields=['broker_name', 'is_active']),
            models.Index(fields=['created_by', 'is_active']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['created_by', 'phone_number'],
                name='unique_broker_phone_per_user',
                condition=models.Q(phone_number__isnull=False) & ~models.Q(phone_number='')
            ),
            models.UniqueConstraint(
                fields=['created_by', 'email'],
                name='unique_broker_email_per_user',
                condition=models.Q(email__isnull=False) & ~models.Q(email='')
            ),
        ]

    def __str__(self):
        return self.broker_name or "Unnamed Broker"

    def clean(self):
        from django.core.exceptions import ValidationError
        import re
        super().clean()
        if self.pan_number:
            if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', self.pan_number):
                raise ValidationError({'pan_number': 'PAN number must be in format: ABCDE1234F'})
        if self.gst_number:
            if not re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$', self.gst_number):
                raise ValidationError({'gst_number': 'Invalid GST number format'})
