from rest_framework import serializers

from common.image import build_absolute_image_url

from .models import FeedPost
from .validators import validate_feed_attachment


class FeedPostTeacherSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, instance):
        profile = getattr(instance, "profile", None)
        if profile is None:
            return None
        return build_absolute_image_url(self.context.get("request"), profile.avatar)


class FeedPostSerializer(serializers.ModelSerializer):
    """Read serializer used everywhere a post is returned."""

    teacher = FeedPostTeacherSerializer(read_only=True)
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = FeedPost
        fields = [
            "id",
            "course_id",
            "teacher",
            "title",
            "caption",
            "attachment",
            "attachment_original_name",
            "attachment_type",
            "attachment_size",
            "created_at",
        ]
        read_only_fields = fields

    def get_attachment(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.attachment)


class FeedPostCreateSerializer(serializers.ModelSerializer):
    """Teacher-facing create serializer — course and teacher are always
    server-assigned from the URL/request, never client input."""

    class Meta:
        model = FeedPost
        fields = ["title", "caption", "attachment"]

    def validate_attachment(self, value):
        if not value:
            return value
        # Raises on failure; the category it returns is recomputed where it's
        # actually needed (the view), matching messaging's validator convention.
        validate_feed_attachment(value)
        return value

    def validate(self, attrs):
        caption = (attrs.get("caption") or "").strip()
        attachment = attrs.get("attachment")
        if not caption and not attachment:
            raise serializers.ValidationError("A post must include a caption or an attachment.")
        return attrs

    def to_representation(self, instance):
        return FeedPostSerializer(instance, context=self.context).data


class FeedPostUpdateSerializer(serializers.ModelSerializer):
    """Author-facing edit — only the caption/title text is editable; the
    attachment itself is immutable (delete and re-post instead)."""

    class Meta:
        model = FeedPost
        fields = ["title", "caption"]

    def to_representation(self, instance):
        return FeedPostSerializer(instance, context=self.context).data
