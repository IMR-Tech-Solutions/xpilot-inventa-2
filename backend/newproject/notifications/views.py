from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import FCMToken, Notification
from .serializers import NotificationSerializer

class SaveFCMTokenView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        token = request.data.get('token')
        device_type = request.data.get('device_type', 'web')
        
        if not token:
            return Response({
                'error': 'FCM token is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        fcm_token, created = FCMToken.objects.update_or_create(
            user=request.user,
            defaults={
                'token': token,
                'device_type': device_type,
                'is_active': True
            }
        )
        
        return Response({
            'message': 'FCM token saved successfully',
            'created': created
        })

class GetNotificationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        base_qs =  Notification.objects.filter(user=request.user)
        notifications =base_qs.order_by("-created_at")[:10] 
        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            'notifications': serializer.data,
            'unread_count': base_qs.filter(is_read=False).count()
        })

class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
            
            return Response({'message': 'Notification marked as read'})
        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)

class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'Marked {updated} notifications as read'
        })

