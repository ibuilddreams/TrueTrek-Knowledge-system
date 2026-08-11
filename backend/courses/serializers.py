import json

from django.contrib.auth import get_user_model
from django.http import QueryDict
from rest_framework import serializers

from assignments.models import Assignment
from common.image import build_absolute_image_url
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Quiz

from .models import Category, Course, CourseInstructor, Tag

UserModel = get_user_model()

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
        fields = ["id", "title", "slug", "code", "image", "category", "status", "tags", "instructors", "created_at", "updated_at"]
        read_only_fields = fields

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


class PublicCourseListSerializer(CourseListSerializer):
    """Anonymous-safe course card data — published courses only, no instructor PII."""

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
            "duration_minutes",
        ]
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

        return super().to_internal_value(data)

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
