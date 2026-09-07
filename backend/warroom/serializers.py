from rest_framework import serializers

from common.image import build_absolute_image_url
from enrollments.models import Enrollment
from messaging.validators import validate_message_attachment

from .models import RoomMessage


class RoomSenderSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    role = serializers.CharField()
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, instance):
        profile = getattr(instance, "profile", None)
        if profile is None:
            return None
        return build_absolute_image_url(self.context.get("request"), profile.avatar)


class RoomMessageSerializer(serializers.ModelSerializer):
    sender = RoomSenderSerializer(read_only=True)
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = RoomMessage
        fields = [
            "id",
            "course_id",
            "sender",
            "body",
            "created_at",
            "is_edited",
            "edited_at",
            "is_deleted",
            "attachment",
            "attachment_original_name",
            "attachment_type",
            "attachment_size",
        ]
        read_only_fields = fields

    def get_attachment(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.attachment)


class LastRoomMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = RoomMessage
        fields = ["id", "sender_id", "body", "is_deleted", "attachment_type", "created_at"]
        read_only_fields = fields


class RoomSerializer(serializers.Serializer):
    """A course, presented as a War Room — there is no Room model, the room
    *is* the course (see warroom.models.RoomMessage's docstring)."""

    id = serializers.IntegerField(source="pk")
    title = serializers.CharField()
    thumbnail = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    def get_thumbnail(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.thumbnail)

    def get_participant_count(self, obj):
        return Enrollment.objects.filter(
            course=obj, status=Enrollment.EnrollmentStatus.ACTIVE
        ).count() + obj.instructors.count()

    def get_last_message(self, obj):
        last_message = (
            RoomMessage.objects.filter(course=obj).select_related("sender").order_by("-created_at").first()
        )
        if last_message is None:
            return None
        return LastRoomMessageSerializer(last_message, context=self.context).data


class SendRoomMessageSerializer(serializers.Serializer):
    body = serializers.CharField(required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)

    def validate_body(self, value):
        value = (value or "").strip()
        if len(value) > 5000:
            raise serializers.ValidationError("Message body cannot exceed 5000 characters.")
        return value

    def validate_attachment(self, value):
        if not value:
            return value
        # Raises on failure; the category it returns is recomputed where it's
        # actually needed (the view) — reuses messaging's validator directly.
        validate_message_attachment(value)
        return value

    def validate(self, attrs):
        body = (attrs.get("body") or "").strip()
        attachment = attrs.get("attachment")
        if not body and not attachment:
            raise serializers.ValidationError("Message must include text or an attachment.")
        return attrs


class EditRoomMessageSerializer(serializers.Serializer):
    body = serializers.CharField()

    def validate_body(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message body cannot be empty.")
        if len(value) > 5000:
            raise serializers.ValidationError("Message body cannot exceed 5000 characters.")
        return value
