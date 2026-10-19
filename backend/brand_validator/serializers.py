from rest_framework import serializers

from .models import MediaKitReview
from .validators import validate_media_kit_file


class MediaKitReviewSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaKitReview
        fields = [
            "id",
            "original_name",
            "file_size",
            "file_url",
            "athlete_context",
            "status",
            "is_media_kit",
            "overall_score",
            "verdict",
            "sponsor_verdict",
            "summary",
            "strengths",
            "weaknesses",
            "recommendations",
            "missing_elements",
            "error_message",
            "created_at",
            "completed_at",
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class MediaKitReviewListSerializer(serializers.ModelSerializer):
    """Lighter shape for the history list — the findings arrays are only
    needed on the detail/results screen and would bloat every list page."""

    class Meta:
        model = MediaKitReview
        fields = [
            "id",
            "original_name",
            "status",
            "overall_score",
            "verdict",
            "created_at",
            "completed_at",
        ]


class MediaKitUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    athlete_context = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate_file(self, value):
        # Returns the mime type, stashed here so the view doesn't re-derive
        # it from the extension a second time.
        self.context["mime_type"] = validate_media_kit_file(value)
        return value
