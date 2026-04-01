from django.db import models
from accounts.models import UserMaster
from decimal import Decimal


class Vendor(models.Model):
    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE)
    vendor_name = models.CharField(max_length=150, null=True, blank=True)
    contact_person = models.CharField(max_length=150, null=True, blank=True)
    contact_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    gst_number = models.CharField(max_length=15, null=True, blank=True)
    pan_number = models.CharField(max_length=10, null=True, blank=True)
    registration_number = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    account_number = models.CharField(max_length=30, null=True, blank=True)
    ifsc_code = models.CharField(max_length=15, null=True, blank=True)
    upi_id = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'email'],
                name='unique_vendor_email_per_user',
                condition=models.Q(email__isnull=False) & ~models.Q(email='')
            ),
            models.UniqueConstraint(
                fields=['user', 'contact_number'],
                name='unique_vendor_contact_per_user',
                condition=models.Q(contact_number__isnull=False) & ~models.Q(contact_number='')
            ),
        ]

    def __str__(self):
        return self.vendor_name or "Unnamed Vendor"


class VendorInvoice(models.Model):
    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE, related_name="vendor_invoices")
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="invoices")
    invoice_number = models.CharField(max_length=50, unique=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'vendor']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.vendor.vendor_name}"

    def generate_invoice_number(self):
        from django.utils import timezone
        today = timezone.now()
        prefix = f"VI{today.year}{today.month:02d}{today.day:02d}"
        last_invoice = VendorInvoice.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('invoice_number').last()
        if last_invoice:
            try:
                last_number = int(last_invoice.invoice_number[-3:])
                new_number = last_number + 1
            except Exception:
                new_number = 1
        else:
            new_number = 1
        return f"{prefix}{new_number:03d}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)
