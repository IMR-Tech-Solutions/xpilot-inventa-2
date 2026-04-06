from django.db import models
from accounts.models import UserMaster
from categories.models import Category
import random
import string

def default_product_image():
    return 'product_images/default.png'

class ProductUnit(models.Model):
    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE)
    unitName = models.CharField(max_length=100)

    def __str__(self):
        return self.unitName
    

class Product(models.Model):
    user = models.ForeignKey(UserMaster, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE,related_name='products')
    product_name = models.CharField(max_length=150)
    product_image = models.ImageField(
        upload_to="product_images/",
        null=True,
        blank=True,
        default=default_product_image
    )
    sku_code = models.CharField(max_length=50, blank=True)
    hsn_code = models.CharField(max_length=20, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE,null=True, blank=True)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    is_live = models.BooleanField(default=False)  
    is_active = models.BooleanField(default=True)  
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'sku_code'], name='unique_sku_per_user')
        ]
    def _generate_unique_sku(self):
        while True:
            sku = 'SKU-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Product.objects.filter(user=self.user, sku_code=sku).exists():
                return sku

    def save(self, *args, **kwargs):
        if not self.sku_code:
            self.sku_code = self._generate_unique_sku()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_name} - {self.category.category_name}"
    



