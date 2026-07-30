import os

from rest_framework import serializers

from common.image import build_absolute_image_url
from common.models import Status
from common.ordering import get_next_order
from courses.models import Course
from modules.models import Module

from .models import (
    Assignment,
    AssignmentAttachment,
    AssignmentSubmission,
    AssignmentSubmissionFile,
)
from .validators import validate_assignment_file


class AssignmentCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "slug"]
        read_only_fields = fields


class AssignmentModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "title"]
        read_only_fields = fields


class AssignmentAttachmentSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentAttachment
        fields = ["id", "file", "original_name", "file_type", "created_at"]
        read_only_fields = fields

    def get_file(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.file)


class AssignmentSerializer(serializers.ModelSerializer):
    course = AssignmentCourseSerializer(read_only=True)
    module = AssignmentModuleSerializer(read_only=True)
    attachments = AssignmentAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "course",
            "module",
            "title",
            "description",
            "due_date",
            "total_marks",
            "status",
            "grading_mode",
            "order",
            "allow_resubmission",
            "attachments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AssignmentWriteSerializer(serializers.ModelSerializer):
    module = serializers.PrimaryKeyRelatedField(
        queryset=Module.objects.all(), required=False, allow_null=True
    )
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), required=False)
    order = serializers.IntegerField(min_value=1, required=False)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "course",
            "module",
            "title",
            "description",
            "due_date",
            "total_marks",
            "status",
            "grading_mode",
            "order",
            "allow_resubmission",
        ]
        read_only_fields = ["id"]
        # See QuizWriteSerializer's identical comment: the conditional UniqueConstraint on
        # (module, order) would otherwise force `module` to be required via an
        # auto-generated UniqueTogetherValidator.
        validators = []

    def validate_total_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError("Total marks must be greater than zero.")
        return value

    def validate(self, attrs):
        module = attrs.get("module", getattr(self.instance, "module", None))
        course = attrs.get("course", getattr(self.instance, "course", None))

        if module is not None:
            attrs["course"] = module.course
        elif not course:
            raise serializers.ValidationError(
                {"course": "Either a course or a module must be provided."}
            )

        current_status = getattr(self.instance, "status", Status.DRAFT)
        new_status = attrs.get("status", current_status)
        if new_status == Status.PUBLISHED and current_status != Status.PUBLISHED:
            if current_status == Status.ARCHIVED:
                raise serializers.ValidationError(
                    {"status": "An archived assignment cannot be published."}
                )
            total_marks = attrs.get("total_marks", getattr(self.instance, "total_marks", None))
            if not total_marks:
                raise serializers.ValidationError(
                    {"status": "Total marks must be greater than zero before publishing."}
                )

        return attrs

    def create(self, validated_data):
        module = validated_data.get("module")
        if module is not None and not validated_data.get("order"):
            validated_data["order"] = get_next_order(Assignment.objects.filter(module=module))
        validated_data["created_by"] = self.context["request"].user
        return Assignment.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AssignmentAttachmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentAttachment
        fields = ["id", "file"]
        read_only_fields = ["id"]

    def validate_file(self, value):
        validate_assignment_file(value)
        return value

    def create(self, validated_data):
        file = validated_data["file"]
        file_type = validate_assignment_file(file)
        return AssignmentAttachment.objects.create(
            assignment=validated_data["assignment"],
            file=file,
            original_name=os.path.basename(file.name),
            file_type=file_type,
            uploaded_by=validated_data.get("uploaded_by"),
        )

    def update(self, instance, validated_data):
        file = validated_data.get("file")
        if file is not None:
            file_type = validate_assignment_file(file)
            instance.file = file
            instance.original_name = os.path.basename(file.name)
            instance.file_type = file_type
            instance.save(update_fields=["file", "original_name", "file_type"])
        return instance


class AssignmentOrderEntrySerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)


class AssignmentSubmissionFileSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmissionFile
        fields = ["id", "file", "original_name", "file_type", "created_at"]
        read_only_fields = fields

    def get_file(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.file)


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment = serializers.SerializerMethodField()
    student = serializers.SerializerMethodField()
    files = AssignmentSubmissionFileSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id",
            "assignment",
            "student",
            "submission_text",
            "submitted_at",
            "status",
            "marks",
            "feedback",
            "graded_at",
            "files",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_assignment(self, obj):
        return {"id": obj.assignment_id, "title": obj.assignment.title, "total_marks": obj.assignment.total_marks}

    def get_student(self, obj):
        return {"id": obj.student_id, "name": obj.student.name}


class AssignmentSubmitSerializer(serializers.Serializer):
    submission_text = serializers.CharField(required=False, allow_blank=True, default="")


class AssignmentGradeSerializer(serializers.Serializer):
    marks = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, default="")
