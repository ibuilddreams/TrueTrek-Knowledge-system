from django.contrib import admin

from .models import Lesson, LessonAttachment, LessonResource, VideoLesson


class LessonResourceInline(admin.TabularInline):
    model = LessonResource
    extra = 1


class LessonAttachmentInline(admin.TabularInline):
    model = LessonAttachment
    extra = 1


class VideoLessonInline(admin.StackedInline):
    model = VideoLesson
    extra = 0


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "order", "duration_minutes", "created_at")
    list_filter = ("module__course",)
    search_fields = ("title", "module__title")
    ordering = ("module", "order")
    autocomplete_fields = ("module",)
    inlines = (VideoLessonInline, LessonResourceInline, LessonAttachmentInline)


@admin.register(LessonResource)
class LessonResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "lesson", "resource_type", "created_at")
    list_filter = ("resource_type",)
    search_fields = ("title", "lesson__title")
    autocomplete_fields = ("lesson",)


@admin.register(LessonAttachment)
class LessonAttachmentAdmin(admin.ModelAdmin):
    list_display = ("lesson", "file_type", "created_at")
    list_filter = ("file_type",)
    search_fields = ("lesson__title",)
    autocomplete_fields = ("lesson",)


@admin.register(VideoLesson)
class VideoLessonAdmin(admin.ModelAdmin):
    list_display = ("lesson", "provider", "duration_seconds", "created_at")
    list_filter = ("provider",)
    search_fields = ("lesson__title",)
    autocomplete_fields = ("lesson",)
