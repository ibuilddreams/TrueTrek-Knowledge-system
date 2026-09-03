import os

from django.utils import timezone
from rest_framework import serializers

from common.image import build_absolute_image_url

from .models import AdminDrillQuizChoice, AdminDrillQuizQuestion, AdminDrillSchedule, DrillOption, DrillQuestion


class DrillOptionSerializer(serializers.ModelSerializer):
    """Option as shown before it has been picked: no score/impact/rationale,
    so a student can't infer the right answer from the network response."""

    class Meta:
        model = DrillOption
        fields = ["id", "key", "text"]
        read_only_fields = fields


class DrillOptionResultSerializer(serializers.ModelSerializer):
    """Full option detail, only ever sent for the option the student picked."""

    class Meta:
        model = DrillOption
        fields = ["id", "key", "text", "impact", "score", "rationale"]
        read_only_fields = fields


class DrillQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = DrillQuestion
        fields = ["id", "scenario", "guidelines", "options"]
        read_only_fields = fields

    def get_options(self, question):
        selected_option_id = self.context.get("selected_option_id")
        options = []
        for option in question.options.order_by("key"):
            if option.id == selected_option_id:
                options.append(DrillOptionResultSerializer(option).data)
            else:
                options.append(DrillOptionSerializer(option).data)
        return options


class DrillAnswerSubmitSerializer(serializers.Serializer):
    """Body for `POST /daily-drill/attempt/` — the unified single-question
    submit endpoint shared by the AI_QUESTION and LEGACY_QUESTION sources.
    Answering by key (not a numeric DB id) works for both: legacy
    `DrillOption` rows already carry a `key`, and AI-generated options have
    no DB row at all, only a key."""

    answer_key = serializers.CharField(max_length=1)


# ---------------------------------------------------------------------------
# Admin-scheduled video Daily Drills
# ---------------------------------------------------------------------------

VIDEO_MAX_SIZE_MB = 200
VIDEO_ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".avi"]


class AdminDrillQuizChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminDrillQuizChoice
        fields = ["id", "text", "is_correct", "order"]
        read_only_fields = ["id"]


class AdminDrillQuizQuestionSerializer(serializers.ModelSerializer):
    choices = AdminDrillQuizChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = AdminDrillQuizQuestion
        fields = ["id", "text", "order", "choices"]
        read_only_fields = ["id"]


class AdminDrillScheduleSerializer(serializers.ModelSerializer):
    """Admin-facing read shape — includes `is_correct` on choices (unlike the
    student-facing payload built in `services._build_admin_video_payload`,
    which deliberately omits it) since only admins ever see this serializer."""

    quiz_questions = AdminDrillQuizQuestionSerializer(many=True, read_only=True)
    quiz_question_count = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source="created_by.name", read_only=True, default=None)

    class Meta:
        model = AdminDrillSchedule
        fields = [
            "id", "title", "description", "video_url", "file", "file_url",
            "scheduled_date", "reward_points", "passing_score_percent", "status",
            "quiz_questions", "quiz_question_count", "created_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]
        extra_kwargs = {"file": {"write_only": True, "required": False}}

    def get_quiz_question_count(self, schedule):
        return len(schedule.quiz_questions.all())

    def get_file_url(self, schedule):
        return build_absolute_image_url(self.context.get("request"), schedule.file)


class AdminDrillScheduleWriteSerializer(serializers.ModelSerializer):
    """Create/update — deliberately does NOT accept `quiz_questions` here.
    Mixing a `multipart/form-data` video upload with a nested JSON array in
    the same request body is awkward (HTML form encoding has no native
    nested-array support), so the quiz is managed through its own endpoint
    (`PUT /admin/schedules/<id>/quiz/` → `AdminDrillQuizWriteSerializer`
    below), matching `onboarding.Question`'s precedent of a wholesale
    replace-all write rather than a diff.
    """

    class Meta:
        model = AdminDrillSchedule
        fields = [
            "title", "description", "video_url", "file",
            "scheduled_date", "reward_points", "passing_score_percent",
        ]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be blank.")
        return value

    def validate_reward_points(self, value):
        if value <= 0:
            raise serializers.ValidationError("Reward points must be greater than zero.")
        return value

    def validate_passing_score_percent(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Passing score must be between 0 and 100.")
        return value

    def validate_file(self, value):
        if not value:
            return value
        if value.size > VIDEO_MAX_SIZE_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Video file must not exceed {VIDEO_MAX_SIZE_MB}MB.")
        extension = os.path.splitext(value.name)[1].lower()
        if extension not in VIDEO_ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported video type. Allowed types: {', '.join(VIDEO_ALLOWED_EXTENSIONS)}."
            )
        return value

    def validate_scheduled_date(self, value):
        today = timezone.localdate()
        if self.instance is None:
            # Creating a brand-new schedule — must be today or a future date.
            if value < today:
                raise serializers.ValidationError("A Daily Drill cannot be scheduled in the past.")
            return value

        # Editing an existing schedule.
        if self.instance.scheduled_date < today:
            raise serializers.ValidationError(
                "This Daily Drill's scheduled date has already passed and can no longer be edited."
            )
        if value < today:
            raise serializers.ValidationError("A Daily Drill cannot be moved to a past date.")
        return value

    def validate(self, attrs):
        video_url_sent = "video_url" in attrs
        file_sent = "file" in attrs

        if video_url_sent and file_sent:
            # Both explicitly provided in this one request — always invalid,
            # regardless of what the instance already had.
            video_url = attrs.get("video_url")
            file = attrs.get("file")
        elif file_sent:
            # Only a new file was sent — an explicit switch away from a URL,
            # so it replaces (clears) whatever video_url the instance already
            # had, rather than being compared against that stale value (which
            # previously made "upload a file to replace an existing link"
            # incorrectly look like "both are set").
            attrs["video_url"] = None
            video_url, file = None, attrs.get("file")
        elif video_url_sent:
            # Symmetric case: only a new URL was sent — replaces (clears)
            # whatever file the instance already had.
            attrs["file"] = None
            video_url, file = attrs.get("video_url"), None
        else:
            video_url = getattr(self.instance, "video_url", None)
            file = getattr(self.instance, "file", None)

        if video_url and file:
            raise serializers.ValidationError(
                {"video_url": "Provide either a video URL or an uploaded video file, not both."}
            )
        if not video_url and not file:
            raise serializers.ValidationError(
                {"video_url": "A video URL or an uploaded video file is required."}
            )

        if self.instance is not None and self.instance.scheduled_date < timezone.localdate():
            raise serializers.ValidationError(
                "This Daily Drill's scheduled date has already passed and can no longer be edited."
            )

        return attrs


class AdminDrillQuizChoiceWriteSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=500)
    is_correct = serializers.BooleanField(default=False)


class AdminDrillQuizQuestionWriteSerializer(serializers.Serializer):
    text = serializers.CharField()
    choices = AdminDrillQuizChoiceWriteSerializer(many=True)

    def validate_choices(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Each question needs at least 2 choices.")
        if sum(1 for choice in value if choice["is_correct"]) != 1:
            raise serializers.ValidationError("Each question needs exactly one correct choice.")
        return value


class AdminDrillQuizWriteSerializer(serializers.Serializer):
    """Wholesale-replace serializer for `PUT /admin/schedules/<id>/quiz/` —
    the entire question set is deleted and rewritten every call, same
    destructive-replace convention `onboarding.Question` already uses for
    its options."""

    questions = AdminDrillQuizQuestionWriteSerializer(many=True)

    def validate_questions(self, value):
        if not (1 <= len(value) <= 5):
            raise serializers.ValidationError("A Daily Drill quiz must have between 1 and 5 questions.")
        return value

    def save(self, schedule):
        schedule.quiz_questions.all().delete()
        for index, question_data in enumerate(self.validated_data["questions"], start=1):
            question = AdminDrillQuizQuestion.objects.create(
                schedule=schedule, text=question_data["text"], order=index
            )
            for choice_index, choice_data in enumerate(question_data["choices"], start=1):
                AdminDrillQuizChoice.objects.create(
                    question=question,
                    text=choice_data["text"],
                    is_correct=choice_data["is_correct"],
                    order=choice_index,
                )
        return schedule


class VideoProgressSerializer(serializers.Serializer):
    progress_percent = serializers.IntegerField(min_value=0, max_value=100)


class AdminDrillQuizAnswerEntrySerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()


class AdminDrillQuizSubmitSerializer(serializers.Serializer):
    answers = AdminDrillQuizAnswerEntrySerializer(many=True)
