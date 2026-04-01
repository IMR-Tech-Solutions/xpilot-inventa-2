from django.db.models.signals import post_save
from django.dispatch import receiver
from shop.models import ManagerRequest 
from .services import firebase_service
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ManagerRequest)
def notify_manager_on_new_request(sender, instance, created, **kwargs):
    if created:  
        try:
            shop_owner_name = f"{instance.order_item.order.shop_owner.first_name} {instance.order_item.order.shop_owner.last_name}"

            result = firebase_service.notify_manager_new_request(
                manager_id=instance.manager.id,
                request_id=instance.id,
                product_name=instance.product.product_name,
                shop_owner_name=shop_owner_name
            )
            
            if result['success']:
                logger.info(f"Notification sent successfully to manager {instance.manager.id} for request {instance.id}")
            else:
                logger.error(f"Failed to send notification to manager {instance.manager.id}: {result['error']}")
                
        except Exception as e:
            logger.error(f"Error in notification signal: {e}")
