from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import TeacherCredential, TeacherOnboarding
from .services import (
    MAX_BIO_LENGTH,
    MAX_EXPERTISE_ITEMS,
    MAX_EXPERTISE_LENGTH,
    MAX_TEACHING_STATEMENT_LENGTH,
    intro_video_display_url,
    missing_requirements,
)
from .validators import validate_credential_document, validate_intro_video

UserModel = get_user_model()

#: The oldest year a qualification could sensibly carry, and how far into the
#: future one may be dated (a degree awarded this coming summer is ordinary).
MIN_CREDENTIAL_YEAR = 1950


def _absolute_url(file_field, request):
    if not file_field:
        return None
    return request.build_absolute_uri(file_field.url) if request else file_field.url


class OnboardingUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["id", "name", "email"]
        read_only_fields = fields


class TeacherCredentialSerializer(serializers.ModelSerializer):
    credential_type_display = serializers.CharField(
        source="get_credential_type_display", read_only=True
    )
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = TeacherCredential
        fields = [
            "id",
            "credential_type",
            "credential_type_display",
            "title",
            "institution",
            "year_awarded",
            "document_url",
            "original_name",
            "file_size",
            "created_at",
        ]
        read_only_fields = fields

    def get_document_url(self, obj):
        return _absolute_url(obj.document, self.context.get("request"))


class TeacherCredentialCreateSerializer(serializers.ModelSerializer):
    document = serializers.FileField(validators=[validate_credential_document])

    class Meta:
        model = TeacherCredential
        fields = ["credential_type", "title", "institution", "year_awarded", "document"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("A title is required.")
        return value

    def validate_year_awarded(self, value):
        if value is None:
            return value
        latest = timezone.now().year + 1
        if not MIN_CREDENTIAL_YEAR <= value <= latest:
            raise serializers.ValidationError(
                f"Enter a year between {MIN_CREDENTIAL_YEAR} and {latest}."
            )
        return value

    def create(self, validated_data):
        document = validated_data["document"]
        return TeacherCredential.objects.create(
            original_name=document.name[:255],
            file_size=document.size,
            **validated_data,
        )

    def to_representation(self, instance):
        return TeacherCredentialSerializer(instance, context=self.context).data


class TeacherOnboardingSerializer(serializers.ModelSerializer):
    """The one read shape, used by the teacher's own screen and by the admin
    review modal alike — following `teacher_requests`, where a single read
    serializer backs both sides so the two can't drift."""

    teacher = OnboardingUserSerializer(source="user", read_only=True)
    reviewed_by = OnboardingUserSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    highest_qualification_display = serializers.CharField(
        source="get_highest_qualification_display", read_only=True
    )
    credentials = TeacherCredentialSerializer(many=True, read_only=True)
    intro_video_file_url = serializers.SerializerMethodField()
    intro_video_display_url = serializers.SerializerMethodField()
    missing_requirements = serializers.SerializerMethodField()
    is_complete = serializers.SerializerMethodField()
    can_edit = serializers.BooleanField(source="is_editable", read_only=True)

    class Meta:
        model = TeacherOnboarding
        fields = [
            "id",
            "teacher",
            "status",
            "status_display",
            "step",
            "headline",
            "bio",
            "highest_qualification",
            "highest_qualification_display",
            "years_of_experience",
            "linkedin_url",
            "portfolio_url",
            "expertise",
            "teaching_statement",
            "intro_video_file_url",
            "intro_video_url",
            "intro_video_display_url",
            "intro_video_name",
            "intro_video_size",
            "credentials",
            "submitted_at",
            "reviewed_at",
            "reviewed_by",
            "review_notes",
            "can_edit",
            "is_complete",
            "missing_requirements",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_intro_video_file_url(self, obj):
        return _absolute_url(obj.intro_video, self.context.get("request"))

    def get_intro_video_display_url(self, obj):
        return intro_video_display_url(obj, self.context.get("request"))

    def get_missing_requirements(self, obj):
        return missing_requirements(obj)

    def get_is_complete(self, obj):
        return not missing_requirements(obj)


class TeacherOnboardingUpdateSerializer(serializers.ModelSerializer):
    """The teacher's own draft save. Every field is optional, because the
    wizard saves one step at a time and a half-filled application is the
    normal state right up until it is submitted."""

    intro_video = serializers.FileField(
        required=False, allow_null=True, validators=[validate_intro_video]
    )
    # Clearing an upload is a different intent from leaving it alone, and a
    # multipart PATCH has no way to say "null" for a file — hence a flag.
    remove_intro_video = serializers.BooleanField(required=False, write_only=True)

    class Meta:
        model = TeacherOnboarding
        fields = [
            "step",
            "headline",
            "bio",
            "highest_qualification",
            "years_of_experience",
            "linkedin_url",
            "portfolio_url",
            "expertise",
            "teaching_statement",
            "intro_video",
            "intro_video_url",
            "remove_intro_video",
        ]
        extra_kwargs = {
            "headline": {"required": False, "allow_blank": True},
            "bio": {"required": False, "allow_blank": True},
            "highest_qualification": {"required": False, "allow_blank": True},
            "linkedin_url": {"required": False, "allow_blank": True},
            "portfolio_url": {"required": False, "allow_blank": True},
            "teaching_statement": {"required": False, "allow_blank": True},
            "intro_video_url": {"required": False, "allow_blank": True},
        }

    def validate_bio(self, value):
        return value.strip()[:MAX_BIO_LENGTH]

    def validate_teaching_statement(self, value):
        return value.strip()[:MAX_TEACHING_STATEMENT_LENGTH]

    def validate_years_of_experience(self, value):
        if value is not None and value > 70:
            raise serializers.ValidationError("Enter a realistic number of years.")
        return value

    def validate_expertise(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Expertise must be a list of subjects.")

        cleaned = []
        seen = set()
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("Each subject must be text.")
            subject = " ".join(item.split())[:MAX_EXPERTISE_LENGTH]
            if not subject or subject.lower() in seen:
                continue
            seen.add(subject.lower())
            cleaned.append(subject)

        if len(cleaned) > MAX_EXPERTISE_ITEMS:
            raise serializers.ValidationError(
                f"Add up to {MAX_EXPERTISE_ITEMS} subjects."
            )
        return cleaned

    def update(self, instance, validated_data):
        remove_video = validated_data.pop("remove_intro_video", False)
        new_video = validated_data.pop("intro_video", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if remove_video and instance.intro_video:
            instance.intro_video.delete(save=False)
            instance.intro_video = None
            instance.intro_video_name = ""
            instance.intro_video_size = None
        if new_video is not None:
            if instance.intro_video:
                # One intro video per application — replacing it should not
                # leave the old file orphaned in MEDIA_ROOT forever.
                instance.intro_video.delete(save=False)
            instance.intro_video = new_video
            instance.intro_video_name = new_video.name[:255]
            instance.intro_video_size = new_video.size

        instance.save()
        return instance

    def to_representation(self, instance):
        return TeacherOnboardingSerializer(instance, context=self.context).data


class TeacherOnboardingReviewSerializer(serializers.ModelSerializer):
    """The admin's decision. `review_notes` is what the teacher reads, so it
    is required for every decision that asks something of them."""

    REVIEWABLE_STATUSES = [
        TeacherOnboarding.ApplicationStatus.UNDER_REVIEW,
        TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED,
        TeacherOnboarding.ApplicationStatus.APPROVED,
        TeacherOnboarding.ApplicationStatus.REJECTED,
    ]

    NOTES_REQUIRED_FOR = {
        TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED,
        TeacherOnboarding.ApplicationStatus.REJECTED,
    }

    status = serializers.ChoiceField(
        choices=[(value, value.label) for value in REVIEWABLE_STATUSES]
    )
    review_notes = serializers.CharField(
        required=False, allow_blank=True, max_length=4000
    )

    class Meta:
        model = TeacherOnboarding
        fields = ["status", "review_notes"]

    def validate(self, attrs):
        instance = self.instance

        if instance.status == TeacherOnboarding.ApplicationStatus.DRAFT:
            raise serializers.ValidationError(
                "This application hasn't been submitted yet, so there is nothing to review."
            )
        if instance.status == TeacherOnboarding.ApplicationStatus.APPROVED:
            # Terminal on purpose: by now the teacher may have authored
            # courses and been assigned students, and un-approving them here
            # would strip that access from under live classes. Suspending the
            # account (Admin -> Teachers) is the deliberate way to do that.
            raise serializers.ValidationError(
                "This application has already been approved and can no longer be changed."
            )

        notes = (attrs.get("review_notes") or "").strip()
        if attrs["status"] in self.NOTES_REQUIRED_FOR and not notes:
            raise serializers.ValidationError(
                {
                    "review_notes": "Explain your decision — the teacher reads this note.",
                }
            )
        attrs["review_notes"] = notes
        return attrs

    def to_representation(self, instance):
        return TeacherOnboardingSerializer(instance, context=self.context).data


class AdminTeacherOnboardingListSerializer(serializers.ModelSerializer):
    """Flattened row for the admin queue table — the same shape decision
    `quests.AdminQuestSubmissionsView` made, because this backs a table and a
    table reads columns, not nested objects."""

    teacher_name = serializers.CharField(source="user.name", read_only=True)
    teacher_email = serializers.EmailField(source="user.email", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    credentials_count = serializers.IntegerField(read_only=True)
    has_intro_video = serializers.SerializerMethodField()
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.name", read_only=True, default=None
    )

    class Meta:
        model = TeacherOnboarding
        fields = [
            "id",
            "teacher_name",
            "teacher_email",
            "headline",
            "status",
            "status_display",
            "years_of_experience",
            "credentials_count",
            "has_intro_video",
            "submitted_at",
            "reviewed_at",
            "reviewed_by_name",
            "updated_at",
        ]
        read_only_fields = fields

    def get_has_intro_video(self, obj):
        return bool(obj.intro_video or obj.intro_video_url)
