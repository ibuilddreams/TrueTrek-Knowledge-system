from rest_framework import serializers

from common.image import build_absolute_image_url

from .models import Conversation, Message
from .validators import validate_message_attachment


class ParticipantSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, instance):
        profile = getattr(instance, "profile", None)
        if profile is None:
            return None
        return build_absolute_image_url(self.context.get("request"), profile.avatar)


class ReactionSummarySerializer(serializers.Serializer):
    emoji = serializers.CharField()
    count = serializers.IntegerField()
    reacted_by_me = serializers.BooleanField()


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(read_only=True)
    attachment = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender_id",
            "body",
            "is_read",
            "read_at",
            "created_at",
            "is_edited",
            "edited_at",
            "is_deleted",
            "attachment",
            "attachment_original_name",
            "attachment_type",
            "attachment_size",
            "reactions",
        ]
        read_only_fields = fields

    def get_attachment(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.attachment)

    def get_reactions(self, obj):
        request = self.context.get("request")
        current_user_id = request.user.id if request and request.user.is_authenticated else None

        summaries = {}
        for reaction in obj.reactions.all():
            summary = summaries.setdefault(
                reaction.emoji, {"emoji": reaction.emoji, "count": 0, "reacted_by_me": False}
            )
            summary["count"] += 1
            if reaction.user_id == current_user_id:
                summary["reacted_by_me"] = True

        return list(summaries.values())


class LastMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender_id", "body", "is_deleted", "attachment_type", "created_at"]
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "other_participant",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_other_participant(self, obj):
        request = self.context.get("request")
        other = obj.other_participant(request.user)
        return ParticipantSerializer(other, context=self.context).data

    def get_last_message(self, obj):
        last_message = obj.messages.order_by("-created_at").first()
        if last_message is None:
            return None
        return LastMessageSerializer(last_message, context=self.context).data

    def get_unread_count(self, obj):
        request = self.context.get("request")
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()


class StartConversationSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField()


class SendMessageSerializer(serializers.Serializer):
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
        # actually needed (view/service), matching assignments' validator convention.
        validate_message_attachment(value)
        return value

    def validate(self, attrs):
        body = (attrs.get("body") or "").strip()
        attachment = attrs.get("attachment")
        if not body and not attachment:
            raise serializers.ValidationError("Message must include text or an attachment.")
        return attrs


class EditMessageSerializer(serializers.Serializer):
    body = serializers.CharField()

    def validate_body(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message body cannot be empty.")
        if len(value) > 5000:
            raise serializers.ValidationError("Message body cannot exceed 5000 characters.")
        return value


class ReactionInputSerializer(serializers.Serializer):
    emoji = serializers.CharField(max_length=8)

    def validate_emoji(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Emoji is required.")
        return value
