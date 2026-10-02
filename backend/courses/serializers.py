import json

from django.contrib.auth import get_user_model
from django.http import QueryDict
from rest_framework import serializers

from assignments.models import Assignment
from common.models import Status
from common.image import build_absolute_image_url
from enrollments.models import Enrollment
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Quiz

from .models import Category, Course, CourseInstructor, Tag

UserModel = get_user_model()

MAX_LEARNING_OUTCOMES = 12
MAX_LEARNING_OUTCOME_LENGTH = 300

class SimpleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "slug"]
        read_only_fields = fields

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class TagWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["id", "slug"]

    def validate_name(self, value):
        queryset = Tag.objects.filter(name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A tag with this name already exists.")
        return value


class CourseInstructorSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="instructor.id", read_only=True)
    name = serializers.CharField(source="instructor.name", read_only=True)
    email = serializers.EmailField(source="instructor.email", read_only=True)

    class Meta:
        model = CourseInstructor
        fields = ["id", "name", "email", "is_lead"]
        read_only_fields = fields


class CategoryCourseSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    instructors = CourseInstructorSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "code", "status", "tags", "instructors"]
        read_only_fields = fields


class CategorySerializer(serializers.ModelSerializer):
    courses = CategoryCourseSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "created_at", "updated_at", "courses"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def validate_name(self, value):
        queryset = Category.objects.filter(name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A category with this name already exists.")
        return value


class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class CourseListSerializer(serializers.ModelSerializer):
    category = CourseCategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    instructors = CourseInstructorSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "code", "image", "category", "status", "amount", "tags", "instructors", "created_at", "updated_at"]
        read_only_fields = fields

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


class PublicCourseListSerializer(CourseListSerializer):
    """Anonymous-safe course card data — published courses only, no instructor PII."""

    grade_label = serializers.CharField(read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = [
            "id",
            "title",
            "slug",
            "code",
            "description",
            "image",
            "category",
            "tags",
            "difficulty",
            "grade_label",
            "duration_minutes",
            "amount",
        ]
        read_only_fields = fields


class PublicCourseRecommendationSerializer(PublicCourseListSerializer):
    """Public course card plus how many students have purchased/enrolled."""

    purchase_count = serializers.IntegerField(read_only=True)

    class Meta(PublicCourseListSerializer.Meta):
        fields = PublicCourseListSerializer.Meta.fields + ["purchase_count"]
        read_only_fields = fields


class CourseLessonSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "description",
            "content_type",
            "video_url",
            "file",
            "duration_minutes",
            "order",
        ]
        read_only_fields = fields

    def get_file(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.file)


class CourseAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "due_date",
            "total_marks",
            "status",
            "allow_resubmission",
            "order",
        ]
        read_only_fields = fields


class CourseQuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "passing_score",
            "time_limit_minutes",
            "status",
            "order",
        ]
        read_only_fields = fields


class CourseModuleSerializer(serializers.ModelSerializer):
    lessons = CourseLessonSerializer(many=True, read_only=True)
    assignments = CourseAssignmentSerializer(many=True, read_only=True)
    quizzes = CourseQuizSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ["id", "title", "description", "order", "lessons", "assignments", "quizzes"]
        read_only_fields = fields


class CourseDetailSerializer(serializers.ModelSerializer):
    category = CourseCategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    instructors = CourseInstructorSerializer(many=True, read_only=True)
    modules = CourseModuleSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "slug",
            "code",
            "description",
            "thumbnail",
            "image",
            "category",
            "status",
            "difficulty",
            "duration_minutes",
            "amount",
            "learning_outcomes",
            "tags",
            "instructors",
            "modules",
        ]
        read_only_fields = fields

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


class PublicLessonOutlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title", "description", "content_type", "duration_minutes", "order"]
        read_only_fields = fields


class PublicModuleOutlineSerializer(serializers.ModelSerializer):
    lessons = PublicLessonOutlineSerializer(many=True, read_only=True)
    assignments = serializers.SerializerMethodField()
    quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ["id", "title", "description", "order", "lessons", "assignments", "quizzes"]
        read_only_fields = fields

    def get_assignments(self, obj):
        return CourseAssignmentSerializer(
            [item for item in obj.assignments.all() if item.status == Status.PUBLISHED], many=True
        ).data

    def get_quizzes(self, obj):
        return CourseQuizSerializer(
            [item for item in obj.quizzes.all() if item.status == Status.PUBLISHED], many=True
        ).data


class PublicCourseInstructorSerializer(serializers.ModelSerializer):
    """Public instructor card for the course page: name, headline, photo, bio
    and headline numbers — never email or other contact details."""

    name = serializers.CharField(source="instructor.name", read_only=True)
    user_id = serializers.IntegerField(source="instructor_id", read_only=True)
    headline = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = CourseInstructor
        fields = ["id", "user_id", "name", "is_lead", "headline", "bio", "avatar", "stats"]
        read_only_fields = fields

    def get_headline(self, obj):
        extras = getattr(obj.instructor, "instructor_profile", None)
        return extras.headline if extras else ""

    def get_bio(self, obj):
        profile = getattr(obj.instructor, "profile", None)
        return profile.bio if profile else ""

    def get_avatar(self, obj):
        profile = getattr(obj.instructor, "profile", None)
        return build_absolute_image_url(self.context.get("request"), profile.avatar) if profile else None

    def get_stats(self, obj):
        from instructors.services import instructor_stats

        return instructor_stats(obj.instructor)


class PublicCourseDetailSerializer(PublicCourseListSerializer):
    """Public syllabus only; lesson bodies, media, answer keys and user data stay private."""
    modules = PublicModuleOutlineSerializer(many=True, read_only=True)
    instructors = PublicCourseInstructorSerializer(many=True, read_only=True)
    purchase_count = serializers.SerializerMethodField()

    class Meta(PublicCourseListSerializer.Meta):
        fields = PublicCourseListSerializer.Meta.fields + [
            "learning_outcomes",
            "instructors",
            "purchase_count",
            "updated_at",
            "modules",
        ]
        read_only_fields = fields

    def get_purchase_count(self, obj):
        return obj.enrollments.exclude(status=Enrollment.EnrollmentStatus.CANCELLED).count()


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["id", "name", "email"]
        read_only_fields = fields


class CourseInstructorWriteSerializer(serializers.Serializer):
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=UserModel.Roles.TEACHER)
    )
    is_lead = serializers.BooleanField(default=False)


class CourseWriteSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, required=False)
    instructors = CourseInstructorWriteSerializer(many=True, required=False)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "code",
            "description",
            "thumbnail",
            "category",
            "status",
            "difficulty",
            "duration_minutes",
            "amount",
            "learning_outcomes",
            "tags",
            "instructors",
        ]
        read_only_fields = ["id"]

    def to_internal_value(self, data):
        if isinstance(data, QueryDict):
            converted = {}
            for key in data:
                values = data.getlist(key)
                converted[key] = values if key == "tags" else values[-1]
            data = converted

        instructors = data.get("instructors")
        if isinstance(instructors, str):
            try:
                data["instructors"] = json.loads(instructors)
            except ValueError:
                raise serializers.ValidationError({"instructors": "Must be a valid JSON list."})

        outcomes = data.get("learning_outcomes")
        if isinstance(outcomes, str):
            try:
                data["learning_outcomes"] = json.loads(outcomes)
            except ValueError:
                raise serializers.ValidationError({"learning_outcomes": "Must be a valid JSON list."})

        return super().to_internal_value(data)

    def validate_learning_outcomes(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list of points.")
        outcomes = []
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("Each point must be text.")
            text = " ".join(item.split())
            if not text:
                continue
            if len(text) > MAX_LEARNING_OUTCOME_LENGTH:
                raise serializers.ValidationError(
                    f"Each point must be at most {MAX_LEARNING_OUTCOME_LENGTH} characters."
                )
            outcomes.append(text)
        if len(outcomes) > MAX_LEARNING_OUTCOMES:
            raise serializers.ValidationError(f"Add at most {MAX_LEARNING_OUTCOMES} points.")
        return outcomes

    def validate_title(self, value):
        queryset = Course.objects.filter(title__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A course with this title already exists.")
        return value

    def validate_code(self, value):
        code = str(value or "").strip().upper()
        if not code:
            raise serializers.ValidationError("Course code is required.")
        if len(code) > 50:
            raise serializers.ValidationError("Course code must be at most 50 characters.")
        queryset = Course.objects.filter(code__iexact=code)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A course with this code already exists.")
        return code

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Amount must be a positive number.")
        return value

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        instructors = validated_data.pop("instructors", [])

        course = Course.objects.create(**validated_data)
        course.tags.set(tags)
        for entry in instructors:
            CourseInstructor.objects.create(course=course, **entry)

        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.is_teacher:
            if not CourseInstructor.objects.filter(course=course, instructor=request.user).exists():
                CourseInstructor.objects.create(course=course, instructor=request.user, is_lead=True)

        return course

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        instructors = validated_data.pop("instructors", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags is not None:
            instance.tags.set(tags)

        if instructors is not None:
            instance.instructors.all().delete()
            for entry in instructors:
                CourseInstructor.objects.create(course=instance, **entry)

        return instance
