from django.utils import timezone

from courses.models import Course
from courses.services import is_course_instructor
from enrollments.models import Enrollment

from .models import RoomMessage


class RoomMessageEditError(Exception):
    pass


class RoomMessageDeleteError(Exception):
    pass


def can_access_room(user, course):
    """Admin: always. Teacher: instructs the course. Student: ACTIVE enrollment."""
    if user.is_admin:
        return True
    if user.is_teacher:
        return is_course_instructor(user, course)
    if user.is_student:
        return Enrollment.objects.filter(
            student=user, course=course, status=Enrollment.EnrollmentStatus.ACTIVE
        ).exists()
    return False


def get_my_rooms(user):
    """Courses whose War Room `user` may access, as a queryset of Course."""
    if user.is_admin:
        return Course.objects.all()
    if user.is_teacher:
        return Course.objects.filter(instructors__instructor=user).distinct()
    if user.is_student:
        return Course.objects.filter(
            enrollments__student=user, enrollments__status=Enrollment.EnrollmentStatus.ACTIVE
        ).distinct()
    return Course.objects.none()


def send_room_message(course, sender, body="", attachment=None, attachment_category=None):
    return RoomMessage.objects.create(
        course=course,
        sender=sender,
        body=body or "",
        attachment=attachment,
        attachment_original_name=attachment.name if attachment else "",
        attachment_type=attachment_category or "",
        attachment_size=attachment.size if attachment else None,
    )


def edit_room_message(message, user, new_body):
    if message.sender_id != user.pk:
        raise RoomMessageEditError("You can only edit your own messages.")
    if message.is_deleted:
        raise RoomMessageEditError("A deleted message cannot be edited.")

    message.body = new_body
    message.is_edited = True
    message.edited_at = timezone.now()
    message.save(update_fields=["body", "is_edited", "edited_at"])
    return message


def delete_room_message(message, user):
    if message.sender_id != user.pk:
        raise RoomMessageDeleteError("You can only delete your own messages.")
    if message.is_deleted:
        return message

    if message.attachment:
        message.attachment.delete(save=False)

    message.is_deleted = True
    message.deleted_at = timezone.now()
    message.body = ""
    message.attachment_original_name = ""
    message.attachment_type = ""
    message.attachment_size = None
    message.save()
    return message
