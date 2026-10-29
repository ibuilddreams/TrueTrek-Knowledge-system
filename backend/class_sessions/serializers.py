from django.utils import timezone
from rest_framework import serializers

from courses.models import Course

from .models import ClassSession, ClassSessionAttendance
from .services import (
    MAX_DURATION_MINUTES,
    MIN_DURATION_MINUTES,
    can_join_now,
    host_opens_at,
    is_host,
    live_state,
    session_window,
)


class ClassSessionSerializer(serializers.ModelSerializer):
    """The shape both portals render.

    `channel_name` is intentionally absent, along with any Agora credential:
    a channel is only identified to a browser by `POST /<id>/join/`, once
    that user has been checked against the course's roster and the clock
    (`services.issue_join_credentials`).
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
            "created_at",
            "updated_at",
        ]

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

    def get_join_opens_at(self, obj):
        """The door this particular viewer is standing at — the host's opens
        an hour early, so returning the student's time to a teacher would put
        a countdown on a card whose button is already live."""
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
        if value <= timezone.now():
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
