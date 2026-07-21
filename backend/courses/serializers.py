from rest_framework import serializers

from .models import Category, Course


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class CourseListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "category", "status", "created_at", "updated_at"]
        read_only_fields = fields


class CourseDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "category", "status", "created_at", "updated_at"]
        read_only_fields = fields


class CourseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "description", "category", "status"]
        read_only_fields = ["id"]

    def validate_title(self, value):
        queryset = Course.objects.filter(title__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A course with this title already exists.")
        return value
