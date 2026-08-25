import os

from django.utils.html import strip_tags
from rest_framework import serializers

from common.image import build_absolute_image_url
from modules.models import Module

from .models import Lesson
from .sanitize import sanitize_lesson_html

MAX_FILE_SIZE_MB = {
    Lesson.ContentType.VIDEO: 200,
    Lesson.ContentType.PDF: 50,
    Lesson.ContentType.DOCUMENT: 50,
    Lesson.ContentType.IMAGE: 10,
}
ALLOWED_FILE_EXTENSIONS = {
    Lesson.ContentType.VIDEO: [".mp4", ".mov", ".webm", ".mkv", ".avi"],
    Lesson.ContentType.PDF: [".pdf"],
    Lesson.ContentType.DOCUMENT: [".doc", ".docx"],
    Lesson.ContentType.IMAGE: [".jpg", ".jpeg", ".png", ".webp"],
}


class LessonModuleSerializer(serializers.ModelSerializer):
    course = serializers.IntegerField(source="course_id", read_only=True)

    class Meta:
        model = Module
        fields = ["id", "title", "course"]
        read_only_fields = fields


class LessonSerializer(serializers.ModelSerializer):
    module = LessonModuleSerializer(read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "module",
            "title",
            "description",
            "content_type",
            "content_data",
            "content_format",
            "video_url",
            "file",
            "duration_minutes",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_file(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.file)


class LessonWriteSerializer(serializers.ModelSerializer):
    order = serializers.IntegerField(min_value=1)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "module",
            "title",
            "description",
            "content_type",
            "content_data",
            "content_format",
            "video_url",
            "file",
            "duration_minutes",
            "order",
        ]
        read_only_fields = ["id"]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        return value.strip()

    def validate_duration_minutes(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Duration must be greater than zero.")
        return value

    def validate_file(self, value):
        if not value:
            return value

        content_type = self.initial_data.get("content_type", getattr(self.instance, "content_type", None))
        max_size_mb = MAX_FILE_SIZE_MB.get(content_type, min(MAX_FILE_SIZE_MB.values()))
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(f"File size must not exceed {max_size_mb}MB.")

        allowed_extensions = ALLOWED_FILE_EXTENSIONS.get(content_type)
        if allowed_extensions:
            extension = os.path.splitext(value.name)[1].lower()
            if extension not in allowed_extensions:
                raise serializers.ValidationError(
                    f"Unsupported file type for {content_type} lessons. Allowed types: {', '.join(allowed_extensions)}."
                )

        return value

    def validate(self, attrs):
        content_type = attrs.get("content_type", getattr(self.instance, "content_type", None))
        duration_minutes = attrs.get("duration_minutes", getattr(self.instance, "duration_minutes", None))

        if content_type == Lesson.ContentType.VIDEO:
            video_url_sent = "video_url" in attrs
            file_sent = "file" in attrs

            if video_url_sent or file_sent:
                video_url = attrs.get("video_url") if video_url_sent else None
                file = attrs.get("file") if file_sent else None
            else:
                video_url = getattr(self.instance, "video_url", None)
                file = getattr(self.instance, "file", None)

            if video_url and file:
                raise serializers.ValidationError(
                    {"video_url": "Provide either a video URL or an uploaded video file, not both."}
                )
            if not video_url and not file:
                raise serializers.ValidationError(
                    {"video_url": "A video URL or an uploaded video file is required for video lessons."}
                )

            attrs["duration_minutes"] = None
            if video_url_sent or file_sent:
                attrs["video_url"] = video_url or None
                attrs["file"] = file or None
        elif content_type == Lesson.ContentType.TEXT:
            content_data = attrs.get("content_data", getattr(self.instance, "content_data", None))
            content_format = attrs.get(
                "content_format", getattr(self.instance, "content_format", Lesson.ContentFormat.MARKDOWN)
            )
            file = attrs.get("file", getattr(self.instance, "file", None))
            video_url = attrs.get("video_url", getattr(self.instance, "video_url", None))

            if content_format == Lesson.ContentFormat.HTML and content_data:
                content_data = sanitize_lesson_html(content_data)
                attrs["content_data"] = content_data

            text_only = (
                strip_tags(content_data)
                if content_format == Lesson.ContentFormat.HTML and content_data
                else content_data
            )
            if not text_only or not text_only.strip():
                raise serializers.ValidationError(
                    {"content_data": "Content is required for text lessons."}
                )
            if file:
                raise serializers.ValidationError(
                    {"file": "A file should not be provided for text lessons."}
                )
            if video_url:
                raise serializers.ValidationError(
                    {"video_url": "Video URL should not be provided for text lessons."}
                )
            if duration_minutes is not None and duration_minutes <= 0:
                raise serializers.ValidationError(
                    {"duration_minutes": "Duration must be greater than zero."}
                )
            attrs["video_url"] = None
            attrs["file"] = None
        else:
            file = attrs.get("file", getattr(self.instance, "file", None))
            video_url = attrs.get("video_url", getattr(self.instance, "video_url", None))

            if not file:
                raise serializers.ValidationError({"file": "File is required for PDF or document lessons."})
            if not duration_minutes:
                raise serializers.ValidationError(
                    {"duration_minutes": "Duration is required for PDF or document lessons."}
                )
            if video_url:
                raise serializers.ValidationError(
                    {"video_url": "Video URL should not be provided for PDF or document lessons."}
                )
            attrs["video_url"] = None

        return attrs


class LessonOrderEntrySerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)
