from django.contrib import admin

from .models import (
    ClassSession,
    ClassSessionAttendance,
    ClassSessionNotes,
    ClassSessionNotesAudio,
    ClassSessionRecording,
)


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "teacher", "scheduled_at", "duration_minutes", "status")
    list_filter = ("status", "scheduled_at")
    search_fields = ("title", "course__title", "course__code", "teacher__email")
    # Server-owned: a channel name is minted once per class and every token
    # already issued is bound to it (see services.issue_join_credentials).
    readonly_fields = ("channel_name",)


@admin.register(ClassSessionAttendance)
class ClassSessionAttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "user", "role", "first_joined_at", "last_joined_at", "join_count")
    list_filter = ("role",)
    search_fields = ("user__email", "session__title")


@admin.register(ClassSessionRecording)
class ClassSessionRecordingAdmin(admin.ModelAdmin):
    """Read-only on purpose.

    Everything on a recording row is written by the monitor thread that owns
    it (`services._monitor_recording`), and the two identifiers it keeps are
    Agora's handle on a job running somewhere else — editing them here would
    not change the recording, it would only lose our way back to it. A
    recording that went wrong is re-made by recording the class again.
    """

    list_display = ("session", "status", "started_at", "stopped_at", "duration_seconds", "notified_at")
    list_filter = ("status",)
    search_fields = ("session__title", "session__course__code", "storage_key", "sid")
    readonly_fields = (
        "session",
        "started_by",
        "status",
        "resource_id",
        "sid",
        "recorder_uid",
        "storage_key",
        "file_list",
        "started_at",
        "stopped_at",
        "duration_seconds",
        "notified_at",
        "error_message",
    )

    def has_add_permission(self, request):
        return False


@admin.register(ClassSessionNotes)
class ClassSessionNotesAdmin(admin.ModelAdmin):
    """Read-only on purpose, like a recording.

    Every field on a notes run is written by the thread that owns it
    (`services._monitor_notes` / `services._collect_and_summarize`), and
    `agent_id` is Agora's handle on a bot running somewhere else — editing it
    here would not change the transcription, it would only lose our way back
    to it. Notes that came out wrong are re-made by transcribing the class
    again, which is also the only thing that can pay for a second model call.

    The transcript is here rather than hidden because this is where somebody
    checking a surprising line in the notes goes to see what was actually
    said.
    """

    list_display = ("session", "status", "started_at", "stopped_at", "notified_at")
    list_filter = ("status",)
    search_fields = ("session__title", "session__course__code", "title", "agent_id")
    readonly_fields = (
        "session",
        "started_by",
        "status",
        "agent_id",
        "agent_name",
        "bot_uid",
        "storage_prefix",
        "transcript_keys",
        "transcript",
        "title",
        "summary",
        "key_topics",
        "important_points",
        "action_items",
        "next_class",
        "document",
        "started_at",
        "stopped_at",
        "duration_seconds",
        "notified_at",
        "error_message",
    )

    def has_add_permission(self, request):
        return False


@admin.register(ClassSessionNotesAudio)
class ClassSessionNotesAudioAdmin(admin.ModelAdmin):
    """The audio a class was written up from, read-only like everything else
    here.

    Worth having a page at all for one reason: when notes come out wrong or
    empty, this is where you find out whether the class was actually recorded
    — how many segments arrived, how big they were, and which of them the
    model managed to read. The file itself is a record of a room that may be
    full of minors, so nothing on this page is editable and nothing about it
    is linked from either portal.
    """

    list_display = ("notes", "index", "size_bytes", "duration_seconds", "transcribed_at")
    list_filter = ("content_type",)
    search_fields = ("notes__session__title", "notes__session__course__code", "client_key")
    readonly_fields = (
        "notes",
        "index",
        "client_key",
        "file",
        "content_type",
        "size_bytes",
        "duration_seconds",
        "transcript",
        "transcribed_at",
    )

    def has_add_permission(self, request):
        return False
