from django.db import transaction
from products.models import Product
from accounts.models import UserMaster
from .models import ShopOrderItem, ShopOwnerOrders
import logging

logger = logging.getLogger(__name__)

class ShopOrderDistributionService:
    """
    Smart service that distributes shop owner orders to relevant managers
    """
    
    @staticmethod
    def distribute_order_to_managers(order_id):
        """
        Main method: Distributes order items to managers who have stock
        
        Args:
            order_id: ShopOwnerOrders ID
            
        Returns:
            dict: Distribution results
        """
        try:
            order = ShopOwnerOrders.objects.get(id=order_id)
            distribution_results = []
            
            for order_item in order.order_items.all():
                managers_notified = ShopOrderDistributionService._send_requests_for_product(
                    order_item
                )
                
                distribution_results.append({
                    'product': order_item.product.product_name,
                    'requested_quantity': order_item.requested_quantity,
                    'managers_notified': len(managers_notified),
                    'manager_ids': managers_notified
                })
            
            # Update order status
            order.status = 'order_placed'
            order.save()
            
            logger.info(f"Order {order.order_number} distributed successfully")
            
            return {
                'success': True,
                'order_number': order.order_number,
                'distribution_results': distribution_results
            }
            
        except Exception as e:
            logger.error(f"Failed to distribute order {order_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _send_requests_for_product(order_item):
        """
        Send requests to all managers who have stock for this product
        
        Args:
            order_item: ShopOrderItem instance
            
        Returns:
            list: Manager IDs who received requests
        """
        # Find ALL managers who have stock for this product
        managers_with_stock = Product.objects.filter(
            id=order_item.product.id,
            current_stock__gt=0
        ).values_list('user_id', flat=True).distinct()
        
        managers_notified = []
        
        for manager_id in managers_with_stock:
            try:
                # Create manager request record (we'll create this model next)
                ShopOrderDistributionService._create_manager_request(
                    order_item, 
                    manager_id
                )
                
                managers_notified.append(manager_id)
                
                logger.info(
                    f"Request sent to Manager {manager_id} for product {order_item.product.product_name}"
                )
                
            except Exception as e:
                logger.error(
                    f"Failed to send request to Manager {manager_id}: {str(e)}"
                )
        
        return managers_notified
    
    @staticmethod
    def _create_manager_request(order_item, manager_id):
        """
        Create a manager request record
        
        Args:
            order_item: ShopOrderItem instance
            manager_id: Manager's user ID
        """
        # Import here to avoid circular imports
        from .models import ManagerRequest
        
        manager = UserMaster.objects.get(id=manager_id)
        
        ManagerRequest.objects.create(
            order_item=order_item,
            manager=manager,
            product=order_item.product,
            requested_quantity=order_item.requested_quantity,
            status='pending'
        )
    
    @staticmethod
    def get_available_managers_for_product(product_id):
        """
        Utility method to check which managers have stock for a product
        
        Args:
            product_id: Product ID
            
        Returns:
            QuerySet: Managers with active stock
        """
        return UserMaster.objects.filter(
            products__id=product_id,
            products__current_stock__gt=0
        ).distinct()
