import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
from django.utils import timezone
from .models import FCMToken, Notification
import logging
import json
import os

logger = logging.getLogger(__name__)

class FirebaseNotificationService:
    def __init__(self):
        try:
            if not firebase_admin._apps:
                if hasattr(settings, 'FIREBASE_SERVICE_ACCOUNT_JSON') and settings.FIREBASE_SERVICE_ACCOUNT_JSON:
                    service_account_info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
                    cred = credentials.Certificate(service_account_info)
                else:
                    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                firebase_admin.initialize_app(cred)
            self.initialized = True
        except Exception as e:
            logger.error(f"Firebase initialization error: {e}")
            self.initialized = False

    def notify_shop_owner_request_accepted(self, shop_owner_id, manager_name, product_name, quantity, request_id):
        """Notify shop owner when manager accepts their request"""
        title = "Request Accepted!"
        body = f"{manager_name} accepted your request for {quantity}x {product_name}"
        data = {
            'request_id': str(request_id),
            'shop_owner_id': str(shop_owner_id),
            'manager_name': manager_name,
            'product_name': product_name,
            'quantity': str(quantity),
            'type': 'request_accepted'
        }
        return self.send_notification_to_user(shop_owner_id, title, body, data)

    def send_notification_to_user(self, user_id, title, body, data=None):
        if not self.initialized:
            logger.error("Firebase not initialized")
            return {'success': False, 'error': 'Firebase not initialized'}
            
        try:
            fcm_token_obj = FCMToken.objects.filter(user_id=user_id, is_active=True).first()
            if not fcm_token_obj:
                return {'success': False, 'error': 'No FCM token found'}
            message = messaging.Message(
                data={
                    'title': title,
                    'body': body,
                    **{str(k): str(v) for k, v in (data or {}).items()}
                },
                token= fcm_token_obj.token,
            )

            response = messaging.send(message)
            notification = Notification.objects.create(
                user_id=user_id,
                title=title,
                body=body,
                data=data or {},
                status='sent'
            )
            return {
                'success': True,
                'notification_id': notification.id,
                'firebase_response': response
            }

        except Exception as e:
            logger.error(f"Failed to send notification to user {user_id}: {e}")
            Notification.objects.create(
                user_id=user_id,
                title=title,
                body=body,
                data=data or {},
                status='failed'
            )
            return {'success': False, 'error': str(e)}

    def notify_manager_new_request(self, manager_id, request_id, product_name, shop_owner_name):
        """Specific method for notifying managers about new requests"""
        title = "New Order Request"
        body = f"New request from {shop_owner_name} for {product_name}"
        
        data = {
            'request_id': str(request_id),
            'manager_id': str(manager_id),
            'product_name': product_name,
            'shop_owner_name': shop_owner_name,
            'type': 'manager_request'
        }

        return self.send_notification_to_user(manager_id, title, body, data)

firebase_service = FirebaseNotificationService()
