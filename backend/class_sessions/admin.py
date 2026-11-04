from django.contrib import admin

from .models import (
    ClassSession,
    ClassSessionAttendance,
    ClassSessionNotes,
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
