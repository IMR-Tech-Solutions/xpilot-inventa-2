from django.urls import path
from .views import (
    SaveFCMTokenView, GetNotificationsView, 
    MarkNotificationReadView, MarkAllNotificationsReadView
)

urlpatterns = [
    path('fcm-token/', SaveFCMTokenView.as_view(), name='save-fcm-token'),
    path('list/', GetNotificationsView.as_view(), name='get-notifications'),
    path('<int:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),
]
