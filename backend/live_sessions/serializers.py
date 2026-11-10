from datetime import timedelta

from rest_framework import serializers

from . import notes as notes_services
from .models import LiveSession, SessionRSVP, SessionSpeaker
from .services import (
    LIVE_GRACE_MINUTES_AFTER,
    audience_can_speak,
    can_join,
    is_host,
    live_state,
    session_window,
)


class SessionSpeakerSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = SessionSpeaker
        fields = [
            "id",
            "name",
            "headline",
            "sport",
            "school",
            "graduation_year",
            "bio",
            "avatar_url",
            "instagram_handle",
            "is_active",
        ]

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url


class SessionSpeakerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionSpeaker
        fields = [
            "name",
            "headline",
            "sport",
            "school",
            "graduation_year",
            "bio",
            "avatar",
            "instagram_handle",
            "is_active",
        ]


class LiveSessionSerializer(serializers.ModelSerializer):
    """Student-facing shape.

    `meeting_url` is intentionally absent: the link is only ever released by
    `GET /live-sessions/<id>/join/` once the room is open (see
    services.get_join_url), so it must not leak through a listing.

    **`channel_name` is absent for the same reason, and more strictly.** A
    session hosted here runs in an Agora channel, which anybody holding a
    token for it can walk into — so the channel is never in a payload and the
    only thing that hands one out is `POST /live-sessions/<id>/room/`, which
    mints a token bound to one person and one channel at the same moment.
    This is exactly the rule `class_sessions` applies to a class.
    """

    speakers = SessionSpeakerSerializer(many=True, read_only=True)
    meeting_method_display = serializers.CharField(source="get_meeting_method_display", read_only=True)
    live_state = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()
    is_rsvped = serializers.SerializerMethodField()
    rsvp_count = serializers.IntegerField(read_only=True, default=0)
    seats_remaining = serializers.SerializerMethodField()
    ends_at = serializers.SerializerMethodField()
    join_opens_at = serializers.SerializerMethodField()
    room_closes_at = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    # Whether the audio runs here or on somebody else's link — which is the
    # difference between a button that opens the room and one that opens a
    # new tab.
    is_hosted_here = serializers.BooleanField(read_only=True)
    audience_can_speak = serializers.SerializerMethodField()
    is_host = serializers.SerializerMethodField()
    notes_configured = serializers.SerializerMethodField()
    notes_available = serializers.SerializerMethodField()

    class Meta:
        model = LiveSession
        fields = [
            "id",
            "title",
            "description",
            "topic",
            "talking_points",
            "scheduled_at",
            "ends_at",
            "join_opens_at",
            "room_closes_at",
            "duration_minutes",
            "meeting_method",
            "meeting_method_display",
            "is_hosted_here",
            "audience_access",
            "audience_can_speak",
            "is_host",
            "takes_notes",
            "notes_configured",
            "notes_available",
            "speakers",
            "capacity",
            "seats_remaining",
            "rsvp_count",
            "status",
            "cancellation_reason",
            "live_state",
            "can_join",
            "is_rsvped",
            "cover_image_url",
            "recording_url",
            "recap",
        ]

    def get_live_state(self, obj):
        return live_state(obj)

    def get_can_join(self, obj):
        return can_join(obj)

    def get_is_rsvped(self, obj):
        # Prefetched by the views into `context["rsvped_session_ids"]` so a
        # list of sessions costs one query instead of one per row.
        rsvped = self.context.get("rsvped_session_ids")
        if rsvped is not None:
            return obj.pk in rsvped
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return SessionRSVP.objects.filter(session=obj, student=request.user).exists()

    def get_seats_remaining(self, obj):
        if obj.capacity is None:
            return None
        taken = getattr(obj, "rsvp_count", None)
        if taken is None:
            taken = obj.rsvps.count()
        return max(0, obj.capacity - taken)

    def get_ends_at(self, obj):
        _, _, ends_at = session_window(obj)
        return ends_at

    def get_join_opens_at(self, obj):
        opens_at, _, _ = session_window(obj)
        return opens_at

    def get_room_closes_at(self, obj):
        """When the server stops letting anybody in, which is later than
        `ends_at` — these sessions run over and the room stays open for it
        (`services.LIVE_GRACE_MINUTES_AFTER`).

        Sent rather than left for the browser to work out, because a room
        left open past the moment the server shut it is one nobody can
        rejoin, and a client re-deriving that grace from a number it does not
        hold is how the two end up disagreeing."""
        _, _, ends_at = session_window(obj)
        return ends_at + timedelta(minutes=LIVE_GRACE_MINUTES_AFTER)

    def get_audience_can_speak(self, obj):
        return audience_can_speak(obj)

    def get_is_host(self, obj):
        """Whether the person reading this runs War Room Live.

        Answered per viewer rather than stored, the same way
        `class_sessions` answers "can I manage this class" — it decides which
        controls a card offers, and the server is the only thing entitled to
        say.
        """
        request = self.context.get("request")
        return bool(request and is_host(request.user, obj))

    def get_notes_configured(self, obj):
        # A pure settings read, so it costs nothing to answer once per row —
        # and it is what lets the room show the notes button disabled with a
        # reason rather than offering one that could only fail.
        return notes_services.is_notes_configured()

    def get_notes_available(self, obj):
        # Prefetched by the views into `context["sessions_with_notes"]` so a
        # list of sessions costs one query instead of one per row.
        with_notes = self.context.get("sessions_with_notes")
        if with_notes is not None:
            return obj.pk in with_notes
        return notes_services.latest_available_notes(obj) is not None

    def get_cover_image_url(self, obj):
        if not obj.cover_image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url


class LiveSessionWriteSerializer(serializers.ModelSerializer):
    speaker_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=SessionSpeaker.objects.all(), source="speakers", required=False
    )

    class Meta:
        model = LiveSession
        fields = [
            "title",
            "description",
            "topic",
            "talking_points",
            "scheduled_at",
            "duration_minutes",
            "meeting_method",
            "meeting_url",
            "audience_access",
            "takes_notes",
            "speaker_ids",
            "capacity",
            "status",
            "cancellation_reason",
            "cover_image",
            "recording_url",
            "recap",
        ]

    def validate_duration_minutes(self, value):
        if value < 5:
            raise serializers.ValidationError("A session must run for at least 5 minutes.")
        return value

    def validate(self, attrs):
        """A session hosted here has no meeting link, and must not keep one.

        An admin who schedules on Zoom, pastes the link and then switches the
        session to the platform's own room would otherwise leave a live Zoom
        URL on a session that no longer uses it — and `get_join_url` would
        happily hand it out, sending half the room to the wrong place.
        """
        method = attrs.get(
            "meeting_method",
            getattr(self.instance, "meeting_method", LiveSession.MeetingMethod.AGORA),
        )
        if method == LiveSession.MeetingMethod.AGORA:
            attrs["meeting_url"] = None
        return attrs

    def validate_talking_points(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Talking points must be a list of short strings.")
        cleaned = [str(point).strip()[:200] for point in value if str(point).strip()]
        return cleaned[:10]


class AdminLiveSessionSerializer(LiveSessionSerializer):
    """Admins schedule the room, so they do see the link."""

    class Meta(LiveSessionSerializer.Meta):
        fields = LiveSessionSerializer.Meta.fields + ["meeting_url", "created_at", "updated_at"]


class SessionRSVPSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)

    class Meta:
        model = SessionRSVP
        fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "role",
            "attended",
            "joined_at",
            "created_at",
        ]
