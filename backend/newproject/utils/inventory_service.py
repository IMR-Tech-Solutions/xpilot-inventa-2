from django.db import transaction
from django.db.models import F
from django.core.exceptions import ValidationError
from products.models import Product


class InventoryService:

    @staticmethod
    def check_stock_availability(product, required_quantity, user=None):
        """
        Check if required quantity is available via product.current_stock.
        Returns: (is_available: bool, available_quantity: int, product or None)
        """
        # Refresh from DB to get latest stock
        p = Product.objects.get(pk=product.pk)
        is_available = p.current_stock >= required_quantity
        return is_available, p.current_stock, p if is_available else None

    @staticmethod
    def validate_order_items_stock(order_items_data, user=None):
        """
        Validate stock for multiple order items.
        order_items_data: list of dicts [{'product': product_obj, 'quantity': int}, ...]
        Returns: (is_valid: bool, error_messages: list)
        """
        error_messages = []
        for item in order_items_data:
            product = item['product']
            required_qty = item['quantity']
            is_available, available_qty, _ = InventoryService.check_stock_availability(
                product, required_qty, user
            )
            if not is_available:
                error_messages.append(
                    f"Insufficient stock for {product.product_name}. "
                    f"Required: {required_qty}, Available: {available_qty}"
                )
        return len(error_messages) == 0, error_messages

    @staticmethod
    @transaction.atomic
    def reduce_stock(product, quantity, user=None):
        """
        Reduce product.current_stock by quantity.
        Returns: (success: bool, message: str, product or None, None)
        """
        try:
            updated = Product.objects.filter(
                pk=product.pk,
                current_stock__gte=quantity
            ).update(current_stock=F('current_stock') - quantity)

            if not updated:
                p = Product.objects.get(pk=product.pk)
                return False, f"Insufficient stock. Available: {p.current_stock}, Required: {quantity}", None, None

            product.refresh_from_db()
            return True, f"Stock reduced. Remaining: {product.current_stock}", product, None

        except Exception as e:
            return False, f"Error reducing stock: {str(e)}", None, None

    @staticmethod
    @transaction.atomic
    def process_order_inventory(order_items_data, user=None):
        """
        Process inventory reduction for complete order.
        Returns: (success: bool, messages: list, original_refs: dict)
        """
        messages = []
        original_refs = {}

        is_valid, error_messages = InventoryService.validate_order_items_stock(
            order_items_data, user
        )
        if not is_valid:
            return False, error_messages, {}

        for item in order_items_data:
            product = item['product']
            quantity = item['quantity']

            success, message, ref, _ = InventoryService.reduce_stock(product, quantity, user)
            messages.append(f"{product.product_name}: {message}")

            if not success:
                raise ValidationError(f"Failed to reduce stock for {product.product_name}: {message}")

            original_refs[product.id] = ref

        return True, messages, original_refs

    @staticmethod
    @transaction.atomic
    def rollback_stock(product, quantity, user=None):
        """
        Add quantity back to product.current_stock (order cancellation).
        """
        try:
            Product.objects.filter(pk=product.pk).update(
                current_stock=F('current_stock') + quantity
            )
            product.refresh_from_db()
            return True, f"Stock restored. Current stock: {product.current_stock}"
        except Exception as e:
            return False, f"Error restoring stock: {str(e)}"

    @staticmethod
    @transaction.atomic
    def rollback_stock_to_original_batch(original_ref, quantity):
        """
        Restore stock — original_ref is now the Product object.
        """
        return InventoryService.rollback_stock(original_ref, quantity)

    @staticmethod
    def get_available_stock(product, user=None):
        """
        Returns: (available_quantity: int, None)
        """
        p = Product.objects.get(pk=product.pk)
        return p.current_stock, None
