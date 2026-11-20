from django.contrib.auth import get_user_model
from rest_framework import serializers

from common.models import Status
from courses.models import CourseInstructor
from courses.serializers import CourseListSerializer

from .models import Enrollment

UserModel = get_user_model()


class EnrollmentTeacherSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserModel
        fields = ["id", "name", "email", "avatar"]
        read_only_fields = fields

    def get_avatar(self, obj):
        request = self.context.get("request")
        profile = getattr(obj, "profile", None)
        if profile and profile.avatar and request:
            return request.build_absolute_uri(profile.avatar.url)
        return None


class EnrollmentListSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    teacher = EnrollmentTeacherSerializer(read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    # Both come from `card_map`, built once for the whole page by the view
    # (enrollments.services.get_enrollment_card_data) rather than per row, so
    # a library of thirty courses still costs three queries instead of ninety.
    stats = serializers.SerializerMethodField()
    next_lesson = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "course",
            "teacher",
            "status",
            "enrolled_at",
            "completion_percentage",
            "is_completed",
            "stats",
            "next_lesson",
        ]
        read_only_fields = fields

    def get_stats(self, obj):
        card = (self.context.get("card_map") or {}).get(obj.course_id)
        if card is None:
            return {"total_modules": 0, "total_lessons": 0, "completed_lessons": 0}
        return card["stats"]

    def get_next_lesson(self, obj):
        card = (self.context.get("card_map") or {}).get(obj.course_id)
        return card["next_lesson"] if card else None

    def get_completion_percentage(self, obj):
        progress_map = self.context.get("progress_map") or {}
        progress = progress_map.get(obj.course_id)
        if progress is None:
            return 0
        return round(float(progress.completion_percentage or 0), 2)

    def get_is_completed(self, obj):
        progress_map = self.context.get("progress_map") or {}
        progress = progress_map.get(obj.course_id)
        if progress is None:
            return False
        return bool(progress.is_completed)


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
    teacher = EnrollmentTeacherSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "course", "teacher", "status", "enrolled_at"]
        read_only_fields = fields


class CourseEnrolledStudentSerializer(serializers.ModelSerializer):
    student = EnrollmentStudentSerializer(read_only=True)
    teacher = EnrollmentTeacherSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "teacher", "status", "enrolled_at"]
        read_only_fields = fields


class AdminEnrollmentWriteSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=UserModel.Roles.STUDENT)
    )
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=UserModel.Roles.TEACHER)
    )

    class Meta:
        model = Enrollment
        fields = ["id", "student", "course", "teacher"]
        read_only_fields = ["id"]
        # Disable DRF's auto-generated UniqueTogetherValidator for (student, course) — it
        # runs before validate() and raises a generic "must make a unique set" error instead
        # of the friendlier message below. The explicit check in validate() covers the same case.
        validators = []

    def validate(self, attrs):
        student = attrs["student"]
        course = attrs["course"]
        teacher = attrs["teacher"]

        if student.account_status != UserModel.AccountStatus.ACTIVE:
            raise serializers.ValidationError("This student's account is not active.")

        if course.status != Status.PUBLISHED:
            raise serializers.ValidationError("Enrollment is only allowed for published courses.")

        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError("This student is already enrolled in this course.")

        if not CourseInstructor.objects.filter(course=course, instructor=teacher).exists():
            raise serializers.ValidationError("Selected teacher is not assigned to this course.")

        return attrs

    def create(self, validated_data):
        return Enrollment.objects.create(**validated_data)


class EnrollmentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Enrollment.EnrollmentStatus.choices)
    note = serializers.CharField(allow_blank=False)

    def validate_status(self, value):
        current = self.instance.status

        if value == current:
            raise serializers.ValidationError(f"Enrollment is already {current}.")

        if current == Enrollment.EnrollmentStatus.COMPLETED:
            raise serializers.ValidationError("A completed enrollment's status cannot be changed.")

        if (
            current == Enrollment.EnrollmentStatus.CANCELLED
            and value == Enrollment.EnrollmentStatus.ACTIVE
        ):
            raise serializers.ValidationError(
                "A cancelled enrollment cannot be reactivated. Create a new enrollment instead."
            )

        return value
