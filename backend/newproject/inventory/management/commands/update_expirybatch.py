from django.core.management.base import BaseCommand
from inventory.models import StockBatch

class Command(BaseCommand):
    help = 'Update expired stock batches'

    def handle(self, *args, **options):
        count = StockBatch.update_expired_batches()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {count} expired batches')
        )
