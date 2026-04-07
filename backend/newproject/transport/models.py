from django.db import models
from accounts.models import UserMaster


class Transporter(models.Model):
    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE)
    transporter_name = models.CharField(max_length=150, null=True, blank=True)
    contact_person = models.CharField(max_length=150, null=True, blank=True)
    contact_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    gst_number = models.CharField(max_length=15, null=True, blank=True)
    pan_number = models.CharField(max_length=10, null=True, blank=True)
    license_number = models.CharField(max_length=50, null=True, blank=True)
    rc_number = models.CharField(max_length=50, null=True, blank=True)
    vehicle_number = models.CharField(max_length=50, null=True, blank=True)
    vehicle_type = models.CharField(max_length=100, null=True, blank=True)
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
                name='unique_transporter_email_per_user',
                condition=models.Q(email__isnull=False) & ~models.Q(email='')
            ),
            models.UniqueConstraint(
                fields=['user', 'contact_number'],
                name='unique_transporter_contact_per_user',
                condition=models.Q(contact_number__isnull=False) & ~models.Q(contact_number='')
            ),
        ]

    def __str__(self):
        return self.transporter_name or "Unnamed Transporter"
