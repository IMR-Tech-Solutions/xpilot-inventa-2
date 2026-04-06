from django.db import models
from accounts.models import UserMaster

def default_customer_image():
    return 'customers_images/default.png'

class Customer(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    TYPE_CHOICES = [
    ('dairy', 'Dairy'),
    ('distributor_dealer', 'Distributor/Dealer'),
    ('farmer', 'Farmer'),
    ]

    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    village = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    num_of_animals = models.PositiveIntegerField(default=0)
    type_of_customer = models.CharField(
    max_length=20,
    choices=TYPE_CHOICES,
    blank=True,
    null=True
    )
    milk_collection = models.FloatField(blank=True, null=True, help_text="Milk collection in liters")
    competitor_name = models.CharField(max_length=200, blank=True, null=True)
    competitor_mobile_number = models.CharField(max_length=20, blank=True, null=True)
    competitor_address = models.TextField(blank=True, null=True)
    customer_image = models.ImageField(
        upload_to="customers_images/",
        blank=True,
        null=True,
        default=default_customer_image
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'phone'], name='unique_phone'),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone})"


class AnimalType(models.Model):
    """Master list of animal types shared across all customers."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class CustomerAnimal(models.Model):
    """Per-customer animal counts linked to a shared AnimalType."""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='animals')
    animal_type = models.ForeignKey(AnimalType, on_delete=models.PROTECT, related_name='customer_entries')
    count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('customer', 'animal_type')

    def __str__(self):
        return f"{self.customer} — {self.animal_type.name}: {self.count}"
