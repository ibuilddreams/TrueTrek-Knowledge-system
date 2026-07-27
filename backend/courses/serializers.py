import json

from django.contrib.auth import get_user_model
from django.http import QueryDict
from rest_framework import serializers

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
        fields = ["id", "title", "slug", "status", "tags", "instructors"]
        read_only_fields = fields


class CategorySerializer(serializers.ModelSerializer):
    courses = CategoryCourseSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "created_at", "updated_at", "courses"]
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
        fields = ["id", "name", "slug", "description"]
        read_only_fields = fields


class CourseListSerializer(serializers.ModelSerializer):
    category = CourseCategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    instructors = CourseInstructorSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "image", "category", "status", "tags", "instructors", "created_at", "updated_at"]
        read_only_fields = fields

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


class CourseDetailSerializer(serializers.ModelSerializer):
    category = CourseCategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    instructors = CourseInstructorSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "thumbnail",
            "image",
            "category",
            "status",
            "difficulty",
            "duration_minutes",
            "tags",
            "instructors",
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
        instructors = data.get("instructors")
        if isinstance(instructors, str):
            if isinstance(data, QueryDict):
                data = data.copy()
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

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        instructors = validated_data.pop("instructors", [])

        course = Course.objects.create(**validated_data)
        course.tags.set(tags)
        for entry in instructors:
            CourseInstructor.objects.create(course=course, **entry)

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
