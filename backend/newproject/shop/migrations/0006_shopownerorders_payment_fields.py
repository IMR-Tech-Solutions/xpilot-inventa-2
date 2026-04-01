from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0005_shopownerproducts_is_active_default_true'),
    ]

    operations = [
        migrations.AddField(
            model_name='shopownerorders',
            name='payment_status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('partial', 'Partial'), ('paid', 'Paid')],
                default='pending',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='shopownerorders',
            name='payment_method',
            field=models.CharField(
                choices=[('cash', 'Cash'), ('online', 'Online'), ('mix', 'Mix')],
                null=True,
                blank=True,
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='shopownerorders',
            name='amount_paid',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='shopownerorders',
            name='remaining_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='shopownerorders',
            name='online_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='shopownerorders',
            name='offline_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
