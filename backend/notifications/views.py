from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.pagination import Pagination
from common.response import error_response, success_response

from .models import Notification
from .serializers import NotificationSerializer
from .services import mark_all_read, mark_notification_read


class NotificationListView(generics.ListAPIView):
    """The current user's own notifications, newest first — never another
    user's, via the queryset filter."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def list(self, request, *args, **kwargs):
        notifications = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(notifications)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Notifications fetched successfully")


class NotificationUnreadCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return success_response({"unread_count": count}, message="Unread count fetched successfully")


class NotificationMarkReadView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def patch(self, request, pk):
        try:
            notification = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return error_response(message="Notification does not exist.", status_code=404)

        notification = mark_notification_read(notification)
        return success_response(
            NotificationSerializer(notification).data, message="Notification marked as read"
        )


class NotificationMarkAllReadView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        mark_all_read(request.user)
        return success_response(None, message="All notifications marked as read")
