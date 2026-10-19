from rest_framework import serializers

from .models import LiveSession, SessionRSVP, SessionSpeaker
from .services import can_join, live_state, session_window


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
    cover_image_url = serializers.SerializerMethodField()

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
            "duration_minutes",
            "meeting_method",
            "meeting_method_display",
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
        fields = ["id", "student", "student_name", "student_email", "attended", "joined_at", "created_at"]
