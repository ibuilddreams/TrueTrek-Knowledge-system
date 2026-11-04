from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from courses.models import Course

from .models import (
    ClassSession,
    ClassSessionAttendance,
    ClassSessionNotes,
    ClassSessionRecording,
)
from .services import (
    MAX_DURATION_MINUTES,
    MIN_DURATION_MINUTES,
    SCHEDULE_PAST_GRACE_MINUTES,
    active_notes,
    active_recording,
    can_join_now,
    host_opens_at,
    is_host,
    is_notes_configured,
    is_recording_configured,
    is_whiteboard_configured,
    latest_available_notes,
    latest_available_recording,
    live_state,
    session_window,
    slot_is_unchanged,
)


class ClassSessionSerializer(serializers.ModelSerializer):
    """The shape both portals render.

    `channel_name` is intentionally absent, along with any Agora credential:
    a channel is only identified to a browser by `POST /<id>/join/`, once
    that user has been checked against the course's roster and the clock
    (`services.issue_join_credentials`). The whiteboard's room uuid is absent
    for the same reason — only `POST /<id>/whiteboard/` releases it — while
    `whiteboard_*` below say what the board's *state* is, which is what the
    classroom needs to render a button rather than a dead end.
    """

    course_title = serializers.CharField(source="course.title", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    teacher_name = serializers.SerializerMethodField()
    live_state = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()
    is_host = serializers.SerializerMethodField()
    ends_at = serializers.SerializerMethodField()
    join_opens_at = serializers.SerializerMethodField()
    attendee_count = serializers.IntegerField(read_only=True, default=0)
    whiteboard_available = serializers.SerializerMethodField()
    whiteboard_started = serializers.SerializerMethodField()
    recording_available = serializers.SerializerMethodField()
    recording_in_progress = serializers.SerializerMethodField()
    recording_configured = serializers.SerializerMethodField()
    notes_available = serializers.SerializerMethodField()
    notes_in_progress = serializers.SerializerMethodField()
    notes_configured = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = [
            "id",
            "title",
            "description",
            "agenda",
            "course",
            "course_title",
            "course_code",
            "teacher",
            "teacher_name",
            "scheduled_at",
            "ends_at",
            "join_opens_at",
            "duration_minutes",
            "status",
            "cancellation_reason",
            "live_state",
            "can_join",
            "is_host",
            "attendee_count",
            "whiteboard_access",
            "whiteboard_available",
            "whiteboard_started",
            "is_recorded",
            "recording_available",
            "recording_in_progress",
            "recording_configured",
            "takes_notes",
            "notes_available",
            "notes_in_progress",
            "notes_configured",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["whiteboard_access", "is_recorded", "takes_notes"]

    def _request_user(self):
        request = self.context.get("request")
        return getattr(request, "user", None)

    def get_teacher_name(self, obj):
        if not obj.teacher:
            return ""
        return obj.teacher.name or obj.teacher.username

    def get_live_state(self, obj):
        return live_state(obj)

    def get_is_host(self, obj):
        user = self._request_user()
        return bool(user and user.is_authenticated and is_host(user, obj))

    def get_can_join(self, obj):
        return can_join_now(obj, self._request_user())

    def get_ends_at(self, obj):
        _, _, ends_at = session_window(obj)
        return ends_at

    def get_whiteboard_available(self, obj):
        """Whether this server has whiteboard credentials at all.

        A property of the environment rather than of the class, but it is
        carried on the class because that is where the classroom asks the
        question — and a button that opens a board which cannot exist is
        worse than no button.
        """
        return is_whiteboard_configured()

    def get_whiteboard_started(self, obj):
        """Whether a board has ever been opened on this class.

        The room is created on first use, so this doubles as "is there
        anything drawn on it" — which is what lets a student who joins late
        be told there is a board to look at rather than having to guess.
        """
        return bool(obj.whiteboard_room_uuid)

    def get_recording_available(self, obj):
        """Whether there is a finished recording of this class to watch.

        Read from the annotation `services._annotated` puts on every listing
        rather than queried here: a student's past-classes page renders twenty
        of these at once. The fallback is for the handful of places that
        serialize a plain instance (a freshly created class, a `refresh_from_db`
        after an edit), where one extra query is the honest price of not having
        the annotation.
        """
        annotated = getattr(obj, "has_recording", None)
        if annotated is not None:
            return bool(annotated)
        return latest_available_recording(obj) is not None

    def get_recording_in_progress(self, obj):
        """Whether Agora is recording this class right now — the REC dot."""
        annotated = getattr(obj, "recording_in_progress", None)
        if annotated is not None:
            return bool(annotated)
        running = active_recording(obj)
        statuses = ClassSessionRecording.RecordingStatus
        return bool(
            running and running.status in (statuses.STARTING, statuses.RECORDING)
        )

    def get_recording_configured(self, obj):
        """Whether this server can record at all.

        A property of the environment rather than of the class, carried here
        for the same reason `whiteboard_available` is: the classroom asks the
        question where it draws the button, and a record button on a server
        with no recording credentials is worse than none.
        """
        return is_recording_configured()

    def get_notes_available(self, obj):
        """Whether there are finished notes on this class to read.

        Read from the annotation `services._annotated` puts on every listing
        rather than queried here, for the same reason `recording_available`
        is: a past-classes page renders twenty of these at once. The fallback
        is for the handful of places that serialize a plain instance.
        """
        annotated = getattr(obj, "has_notes", None)
        if annotated is not None:
            return bool(annotated)
        return latest_available_notes(obj) is not None

    def get_notes_in_progress(self, obj):
        """Whether this class is being transcribed or written up right now.

        One flag for both halves on purpose: from outside, "the bot is
        listening" and "the model is writing" are the same fact — the notes
        aren't ready yet — and the classroom says which of the two it is from
        the notes endpoint, where it actually matters.
        """
        annotated = getattr(obj, "notes_in_progress", None)
        if annotated is not None:
            return bool(annotated)
        return active_notes(obj) is not None

    def get_notes_configured(self, obj):
        """Whether this server can take notes at all.

        A property of the environment rather than of the class, carried here
        for the same reason `recording_configured` is: the classroom asks the
        question where it draws the button, and a notes button on a server
        with no transcription credentials is worse than none.
        """
        return is_notes_configured()

    def get_join_opens_at(self, obj):
        """The door this particular viewer is standing at.

        Both stand at the scheduled start today, but they are two separate
        constants (see `services.STUDENT_JOIN_WINDOW_MINUTES_BEFORE`) and the
        card counts down to whichever this viewer is waiting on — so it stays
        right if either side is ever given a lead time again.
        """
        user = self._request_user()
        if user and user.is_authenticated and is_host(user, obj):
            return host_opens_at(obj)
        return session_window(obj)[0]


class ClassSessionWriteSerializer(serializers.ModelSerializer):
    """Create/update payload for a teacher.

    `course` is restricted to the courses the requesting teacher actually
    instructs, so an unknown or someone else's course id is a field-level
    validation error rather than a 403 from deeper in the stack.
    `channel_name`, `teacher` and `status` are all server-owned.

    `is_recorded` and `takes_notes` are two independent decisions and are
    offered as two: they are different Agora products on different bills, and
    the class that most wants a write-up is often the one that least wants a
    tape of itself.
    """

    class Meta:
        model = ClassSession
        fields = [
            "course",
            "title",
            "description",
            "agenda",
            "scheduled_at",
            "duration_minutes",
            "is_recorded",
            "takes_notes",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated and not user.is_admin:
            self.fields["course"].queryset = Course.objects.filter(
                instructors__instructor=user
            ).distinct()
        # A class can be edited after it was scheduled (title, agenda, time),
        # but never moved onto a different course — the roster would change
        # under the students who were already told to attend.
        if self.instance is not None:
            self.fields.pop("course")

    def validate_scheduled_at(self, value):
        # An edit posts the whole form back, so a class whose start has
        # already been and gone sends that start time with it. Only a slot
        # that is actually being *moved* has to be in the future — otherwise
        # a teacher could never fix the title of a class that is running, or
        # turn recording off halfway through one.
        if self.instance is not None and slot_is_unchanged(value, self.instance.scheduled_at):
            return value
        if value < timezone.now() - timedelta(minutes=SCHEDULE_PAST_GRACE_MINUTES):
            raise serializers.ValidationError("Pick a start time in the future.")
        return value

    def validate_duration_minutes(self, value):
        if value < MIN_DURATION_MINUTES:
            raise serializers.ValidationError(
                f"A class must run for at least {MIN_DURATION_MINUTES} minutes."
            )
        if value > MAX_DURATION_MINUTES:
            raise serializers.ValidationError(
                f"A class can run for at most {MAX_DURATION_MINUTES // 60} hours."
            )
        return value

    def validate_agenda(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("The agenda must be a list of short lines.")
        cleaned = [str(line).strip()[:200] for line in value if str(line).strip()]
        return cleaned[:10]


class ClassSessionAttendanceSerializer(serializers.ModelSerializer):
    """The teacher's register.

    Named for what it can honestly show: when someone opened the room and how
    often they came back, not how long they stayed (see the model docstring).
    """

    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = ClassSessionAttendance
        fields = [
            "id",
            "user",
            "student_name",
            "student_email",
            "role",
            "first_joined_at",
            "last_joined_at",
            "left_at",
            "join_count",
        ]

    def get_student_name(self, obj):
        return obj.user.name or obj.user.username
