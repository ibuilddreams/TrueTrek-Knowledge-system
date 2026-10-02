import json

from django.http import QueryDict
from rest_framework import serializers

from common.image import build_absolute_image_url
from courses.models import Course
from users.models import UserProfile

from .models import InstructorFeedback, InstructorProfile

MAX_SKILLS = 12
MAX_SKILL_LENGTH = 40
MAX_BIO_LENGTH = 4000
MAX_COMMENT_LENGTH = 1000
MAX_AVATAR_BYTES = 5 * 1024 * 1024


def _profile_value(user, field, default=""):
    profile = getattr(user, "profile", None)
    return getattr(profile, field, default) if profile else default


def _extras(user):
    return getattr(user, "instructor_profile", None)


class InstructorPublicSerializer(serializers.Serializer):
    """Everything shown on /instructors/<id> — never email or contact details."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    headline = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    website = serializers.SerializerMethodField()
    linkedin_url = serializers.SerializerMethodField()
    x_url = serializers.SerializerMethodField()
    youtube_url = serializers.SerializerMethodField()
    intro_video_url = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()

    def _extra(self, obj, field, default=""):
        extras = _extras(obj)
        return getattr(extras, field, default) if extras else default

    def get_headline(self, obj):
        return self._extra(obj, "headline")

    def get_bio(self, obj):
        return _profile_value(obj, "bio")

    def get_avatar(self, obj):
        profile = getattr(obj, "profile", None)
        return build_absolute_image_url(self.context.get("request"), profile.avatar) if profile else None

    def get_website(self, obj):
        return _profile_value(obj, "website")

    def get_linkedin_url(self, obj):
        return self._extra(obj, "linkedin_url")

    def get_x_url(self, obj):
        return self._extra(obj, "x_url")

    def get_youtube_url(self, obj):
        return self._extra(obj, "youtube_url")

    def get_intro_video_url(self, obj):
        return self._extra(obj, "intro_video_url")

    def get_skills(self, obj):
        return self._extra(obj, "skills", []) or []


class InstructorProfileWriteSerializer(serializers.Serializer):
    """The teacher's own editable profile (PATCH /instructors/me/profile/)."""

    headline = serializers.CharField(max_length=120, required=False, allow_blank=True)
    bio = serializers.CharField(max_length=MAX_BIO_LENGTH, required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    x_url = serializers.URLField(required=False, allow_blank=True)
    youtube_url = serializers.URLField(required=False, allow_blank=True)
    intro_video_url = serializers.URLField(required=False, allow_blank=True)
    skills = serializers.ListField(
        child=serializers.CharField(max_length=MAX_SKILL_LENGTH, allow_blank=True),
        required=False,
        max_length=MAX_SKILLS * 3,
    )
    avatar = serializers.ImageField(required=False, allow_null=True)
    remove_avatar = serializers.BooleanField(required=False, default=False)

    def to_internal_value(self, data):
        # A multipart/form body (needed for the photo) flattens everything to
        # strings: the skills list then arrives as a JSON string, so decode it here.
        if isinstance(data, QueryDict):
            data = {key: data.getlist(key)[-1] for key in data}
        else:
            data = dict(data)
        skills = data.get("skills")
        if isinstance(skills, str):
            try:
                data["skills"] = json.loads(skills)
            except ValueError:
                raise serializers.ValidationError({"skills": "Must be a valid JSON list."})
        return super().to_internal_value(data)

    def validate_skills(self, value):
        skills = []
        for item in value:
            text = " ".join(item.split())
            if not text:
                continue
            if text.lower() in {skill.lower() for skill in skills}:
                continue
            skills.append(text)
        if len(skills) > MAX_SKILLS:
            raise serializers.ValidationError(f"Add at most {MAX_SKILLS} skills.")
        return skills

    def validate_avatar(self, value):
        if value is not None and value.size > MAX_AVATAR_BYTES:
            raise serializers.ValidationError("The photo must be 5 MB or smaller.")
        return value

    def validate_headline(self, value):
        return " ".join(value.split())

    def save(self, user):
        data = self.validated_data

        profile, _ = UserProfile.objects.get_or_create(user=user)
        for field in ("bio", "website"):
            if field in data:
                setattr(profile, field, data[field])
        if data.get("remove_avatar"):
            profile.avatar = None
        elif data.get("avatar") is not None:
            profile.avatar = data["avatar"]
        profile.save()

        extras, _ = InstructorProfile.objects.get_or_create(user=user)
        for field in ("headline", "linkedin_url", "x_url", "youtube_url", "intro_video_url", "skills"):
            if field in data:
                setattr(extras, field, data[field])
        extras.save()
        return user


class InstructorFeedbackSerializer(serializers.ModelSerializer):
    """Public feedback card: the student is shown as "First L." only."""

    student_name = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    instructor = serializers.SerializerMethodField()

    class Meta:
        model = InstructorFeedback
        fields = ["id", "rating", "comment", "student_name", "course", "instructor", "created_at"]
        read_only_fields = fields

    def get_student_name(self, obj):
        first = (obj.student.first_name or "").strip()
        last = (obj.student.last_name or "").strip()
        if not first and obj.student.name:
            parts = obj.student.name.split()
            first, last = parts[0], parts[-1] if len(parts) > 1 else ""
        if not first:
            return "Student"
        return f"{first} {last[0]}." if last else first

    def get_course(self, obj):
        return {"id": obj.course_id, "title": obj.course.title, "slug": obj.course.slug}

    def get_instructor(self, obj):
        return {"id": obj.instructor_id, "name": obj.instructor.name}


class InstructorFeedbackWriteSerializer(serializers.Serializer):
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(
        max_length=MAX_COMMENT_LENGTH, required=False, allow_blank=True, default=""
    )

    def validate_comment(self, value):
        return value.strip()
