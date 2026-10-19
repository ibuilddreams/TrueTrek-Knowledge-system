from django.contrib import admin

from .models import LiveSession, SessionRSVP, SessionSpeaker


@admin.register(SessionSpeaker)
class SessionSpeakerAdmin(admin.ModelAdmin):
    list_display = ("name", "headline", "sport", "school", "is_active")
    list_filter = ("is_active", "sport")
    search_fields = ("name", "school")


@admin.register(LiveSession)
class LiveSessionAdmin(admin.ModelAdmin):
    list_display = ("title", "scheduled_at", "duration_minutes", "meeting_method", "status")
    list_filter = ("status", "meeting_method")
    search_fields = ("title", "topic")
    filter_horizontal = ("speakers",)


@admin.register(SessionRSVP)
class SessionRSVPAdmin(admin.ModelAdmin):
    list_display = ("session", "student", "attended", "joined_at")
    list_filter = ("attended",)
    search_fields = ("student__email", "session__title")
