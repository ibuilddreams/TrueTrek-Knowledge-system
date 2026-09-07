from django.utils import timezone

from .models import Notification


def create_notifications_for_users(
    user_ids, *, verb, title, message="", related_object_type="", related_object_id=None
):
    """Bulk-creates one Notification per user id. Used for the Student
    Concern admin fan-out today; written generically so any future producer
    (e.g. teacher_requests) can reuse it without a new notification model."""
    notifications = [
        Notification(
            recipient_id=user_id,
            verb=verb,
            title=title,
            message=message,
            related_object_type=related_object_type,
            related_object_id=related_object_id,
        )
        for user_id in user_ids
    ]
    return Notification.objects.bulk_create(notifications)


def get_unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()


def mark_notification_read(notification):
    if notification.is_read:
        return notification
    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save(update_fields=["is_read", "read_at"])
    return notification


def mark_all_read(user):
    Notification.objects.filter(recipient=user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )
