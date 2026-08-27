from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from courses.models import CourseInstructor
from enrollments.models import Enrollment

from . import broadcasting
from .models import Conversation, Message, MessageReaction

UserModel = get_user_model()
Roles = UserModel.Roles


class MessagingPermissionError(Exception):
    pass


class MessageEditError(Exception):
    pass


class MessageDeleteError(Exception):
    pass


def get_eligible_recipients(user):
    """Users `user` is allowed to start a NEW conversation with.

    - Admin <-> any Teacher or Student.
    - Teacher <-> Admin, plus only Students enrolled in a course this Teacher instructs.
    - Student <-> Admin, plus only Teachers who instruct a course this Student is enrolled in.
    """
    if user.is_admin:
        return UserModel.objects.filter(role__in=[Roles.TEACHER, Roles.STUDENT]).exclude(pk=user.pk)

    if user.is_teacher:
        student_ids = Enrollment.objects.filter(
            course__instructors__instructor=user
        ).values_list("student_id", flat=True).distinct()
        return UserModel.objects.filter(
            models.Q(role=Roles.ADMIN) | models.Q(role=Roles.STUDENT, pk__in=student_ids)
        ).distinct()

    if user.is_student:
        teacher_ids = CourseInstructor.objects.filter(
            course__enrollments__student=user
        ).values_list("instructor_id", flat=True).distinct()
        return UserModel.objects.filter(
            models.Q(role=Roles.ADMIN) | models.Q(role=Roles.TEACHER, pk__in=teacher_ids)
        ).distinct()

    return UserModel.objects.none()


def can_message(sender, recipient):
    if sender.pk == recipient.pk:
        return False
    return get_eligible_recipients(sender).filter(pk=recipient.pk).exists()


def get_or_create_conversation(user_a, user_b):
    lo, hi = sorted([user_a, user_b], key=lambda u: u.pk)
    conversation, _ = Conversation.objects.get_or_create(participant_one=lo, participant_two=hi)
    return conversation


def start_conversation(sender, recipient):
    if not can_message(sender, recipient):
        raise MessagingPermissionError("You are not allowed to message this user.")
    return get_or_create_conversation(sender, recipient)


def send_message(conversation, sender, body="", attachment=None, attachment_category=None):
    message = Message.objects.create(
        conversation=conversation,
        sender=sender,
        body=body or "",
        attachment=attachment,
        attachment_original_name=attachment.name if attachment else "",
        attachment_type=attachment_category or "",
        attachment_size=attachment.size if attachment else None,
    )
    conversation.last_message_at = message.created_at
    conversation.save(update_fields=["last_message_at"])
    broadcasting.notify_new_message(message)
    return message


def edit_message(message, user, new_body):
    if message.sender_id != user.pk:
        raise MessageEditError("You can only edit your own messages.")
    if message.is_deleted:
        raise MessageEditError("A deleted message cannot be edited.")

    message.body = new_body
    message.is_edited = True
    message.edited_at = timezone.now()
    message.save(update_fields=["body", "is_edited", "edited_at"])
    broadcasting.notify_message_edited(message)
    return message


def delete_message(message, user):
    if message.sender_id != user.pk:
        raise MessageDeleteError("You can only delete your own messages.")
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
    broadcasting.notify_message_deleted(message)
    return message


def toggle_reaction(message, user, emoji):
    """Add/replace the user's reaction, or remove it if they re-pick the same
    emoji they already reacted with — matches WhatsApp's tap-to-toggle model."""
    existing = MessageReaction.objects.filter(message=message, user=user).first()

    if existing and existing.emoji == emoji:
        existing.delete()
    elif existing:
        existing.emoji = emoji
        existing.save(update_fields=["emoji"])
    else:
        MessageReaction.objects.create(message=message, user=user, emoji=emoji)

    broadcasting.notify_reaction_changed(message)
    return message


def mark_conversation_read(conversation, user):
    conversation.messages.filter(is_read=False).exclude(sender=user).update(
        is_read=True, read_at=timezone.now()
    )


def get_unread_counts(user):
    unread_messages = Message.objects.filter(
        conversation__in=Conversation.objects.filter(
            models.Q(participant_one=user) | models.Q(participant_two=user)
        ),
        is_read=False,
    ).exclude(sender=user)

    return {
        "unread_messages": unread_messages.count(),
        "unread_conversations": unread_messages.values("conversation_id").distinct().count(),
    }
