from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.serializers import CourseListSerializer

from .models import Enrollment

UserModel = get_user_model()


class EnrollmentListSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "course", "status", "enrolled_at"]
        read_only_fields = fields


class EnrollmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "course"]
        read_only_fields = ["id"]

    def validate_course(self, value):
        request = self.context["request"]
        if Enrollment.objects.filter(student=request.user, course=value).exists():
            raise serializers.ValidationError("You are already enrolled in this course.")
        return value

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        return Enrollment.objects.create(**validated_data)


class EnrollmentStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["id", "name", "email"]
        read_only_fields = fields


class EnrollmentManageSerializer(serializers.ModelSerializer):
    student = EnrollmentStudentSerializer(read_only=True)
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "course", "status", "enrolled_at"]
        read_only_fields = fields


class CourseEnrolledStudentSerializer(serializers.ModelSerializer):
    student = EnrollmentStudentSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "status", "enrolled_at"]
        read_only_fields = fields


class AdminEnrollmentWriteSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=UserModel.Roles.STUDENT)
    )

    class Meta:
        model = Enrollment
        fields = ["id", "student", "course"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if Enrollment.objects.filter(student=attrs["student"], course=attrs["course"]).exists():
            raise serializers.ValidationError("This student is already enrolled in this course.")
        return attrs

    def create(self, validated_data):
        return Enrollment.objects.create(**validated_data)
