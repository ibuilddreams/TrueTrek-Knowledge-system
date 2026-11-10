from django.contrib import admin

from .models import (
    LiveSession,
    LiveSessionNotes,
    LiveSessionNotesAudio,
    SessionRSVP,
    SessionSpeaker,
)


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
    list_display = ("session", "student", "role", "attended", "joined_at")
    list_filter = ("role", "attended")
    search_fields = ("student__email", "session__title")


class LiveSessionNotesAudioInline(admin.TabularInline):
    """The audio a session was written up from, in the order it arrived.

    Read-only: the segments are written by the capturing browser under a
    lock that assigns their order (`notes.store_notes_audio`), and editing
    one by hand would renumber a session's audio behind the pipeline reading
    it.
    """

    model = LiveSessionNotesAudio
    extra = 0
    can_delete = False
    fields = ("index", "size_bytes", "duration_seconds", "content_type", "transcribed_at")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(LiveSessionNotes)
class LiveSessionNotesAdmin(admin.ModelAdmin):
    list_display = ("session", "status", "started_by", "started_at", "notified_at")
    list_filter = ("status",)
    search_fields = ("session__title", "title")
    inlines = [LiveSessionNotesAudioInline]
