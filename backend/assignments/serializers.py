import os

from rest_framework import serializers

from common.image import build_absolute_image_url
from common.models import Status
from common.ordering import get_next_order
from courses.models import Course
from modules.models import Module

from .ai_review.presenters import latest_review_summary
from .models import (
    Assignment,
    AssignmentAttachment,
    AssignmentRubric,
    AssignmentRubricCriterion,
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
        fields = ["id", "file", "original_name", "file_type", "order", "created_at"]
        read_only_fields = fields

    def get_file(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.file)


class AssignmentRubricCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentRubricCriterion
        fields = ["id", "name", "description", "max_marks", "order"]
        read_only_fields = fields


class AssignmentRubricSerializer(serializers.ModelSerializer):
    criteria = AssignmentRubricCriterionSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentRubric
        fields = ["grading_method", "criteria"]
        read_only_fields = fields


class AssignmentSerializer(serializers.ModelSerializer):
    course = AssignmentCourseSerializer(read_only=True)
    module = AssignmentModuleSerializer(read_only=True)
    attachments = AssignmentAttachmentSerializer(many=True, read_only=True)
    rubric = AssignmentRubricSerializer(read_only=True)

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
            "rubric",
            "attachments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


def _save_rubric(assignment, rubric_data):
    """Wholesale-replace an assignment's rubric criteria (delete-all-then-
    recreate) — same convention as onboarding.Question options /
    AdminDrillQuizQuestion, used because a rubric is a short, admin/teacher-
    authored config list, not something that needs a diffed CRUD API."""
    rubric, _ = AssignmentRubric.objects.update_or_create(
        assignment=assignment,
        defaults={
            "grading_method": rubric_data.get("grading_method", AssignmentRubric.GradingMethod.RUBRIC),
        },
    )
    rubric.criteria.all().delete()
    for index, criterion in enumerate(rubric_data.get("criteria") or [], start=1):
        AssignmentRubricCriterion.objects.create(
            rubric=rubric,
            name=criterion["name"],
            description=criterion.get("description", ""),
            max_marks=criterion.get("max_marks", 10),
            order=index,
        )


class AssignmentRubricCriterionWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    max_marks = serializers.IntegerField(required=False, min_value=1, default=10)


class AssignmentRubricWriteSerializer(serializers.Serializer):
    """Nested, wholesale-write payload for an assignment's grading rubric —
    same convention as onboarding.Question options / AdminDrillQuizQuestion:
    the whole criteria list is deleted and recreated on every save rather
    than diffed against a separate criterion CRUD API."""

    grading_method = serializers.ChoiceField(
        choices=AssignmentRubric.GradingMethod.choices,
        required=False,
        default=AssignmentRubric.GradingMethod.RUBRIC,
    )
    criteria = AssignmentRubricCriterionWriteSerializer(many=True, required=False, default=list)


class AssignmentWriteSerializer(serializers.ModelSerializer):
    module = serializers.PrimaryKeyRelatedField(
        queryset=Module.objects.all(), required=False, allow_null=True
    )
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), required=False)
    order = serializers.IntegerField(min_value=1, required=False)
    rubric = AssignmentRubricWriteSerializer(required=False, allow_null=True)

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
            "rubric",
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

        order = attrs.get("order")
        if module is not None and order is not None:
            conflict = Assignment.objects.filter(module=module, order=order)
            if self.instance is not None:
                conflict = conflict.exclude(pk=self.instance.pk)
            if conflict.exists():
                raise serializers.ValidationError(
                    {"order": "An assignment with this order already exists in this module."}
                )

        current_status = getattr(self.instance, "status", Status.DRAFT)
        new_status = attrs.get("status", current_status)
        newly_publishing = new_status == Status.PUBLISHED and current_status != Status.PUBLISHED

        if newly_publishing and current_status == Status.ARCHIVED:
            raise serializers.ValidationError(
                {"status": "An archived assignment cannot be published."}
            )

        # Run the total-marks/rubric checks whenever the assignment WILL be
        # published after this save — not only on the DRAFT/ARCHIVED->PUBLISHED
        # transition. Without this, flipping grading_mode to AI (or editing an
        # AI assignment's rubric down to nothing) on an assignment that is
        # already PUBLISHED skipped validation entirely, since `status` itself
        # never changed in that request — exactly how a live assignment ended
        # up AI-mode with zero configured criteria.
        if new_status == Status.PUBLISHED:
            total_marks = attrs.get("total_marks", getattr(self.instance, "total_marks", None))
            if not total_marks:
                raise serializers.ValidationError(
                    {"status": "Total marks must be greater than zero before publishing."}
                )

            grading_mode = attrs.get("grading_mode", getattr(self.instance, "grading_mode", None))
            if grading_mode == Assignment.GradingMode.AI:
                rubric_data = attrs.get("rubric")
                existing_rubric = getattr(self.instance, "rubric", None)
                # `rubric_data` being present at all means this request will
                # call `_save_rubric()`, which wholesale-replaces the
                # criteria with exactly `rubric_data.get("criteria")` (an
                # explicit `[]` included) — so once a rubric payload is
                # present, validate against what's actually about to be
                # saved, not the criteria still sitting in the DB. Only fall
                # back to the existing rubric's sum when no rubric key was
                # sent at all (i.e. `_save_rubric` won't run, so the existing
                # rubric is untouched by this request).
                if rubric_data is not None:
                    criteria_max_sum = sum(c.get("max_marks", 10) for c in rubric_data.get("criteria") or [])
                elif existing_rubric is not None:
                    criteria_max_sum = sum(existing_rubric.criteria.values_list("max_marks", flat=True))
                else:
                    criteria_max_sum = 0

                if criteria_max_sum == 0:
                    raise serializers.ValidationError(
                        {
                            "rubric": "An AI-graded assignment needs at least one grading "
                            "item (rubric criterion or question) before publishing."
                        }
                    )
                if criteria_max_sum != total_marks:
                    raise serializers.ValidationError(
                        {
                            "rubric": (
                                "The grading items' marks must add up to exactly the "
                                f"assignment's total marks before publishing (currently "
                                f"{criteria_max_sum} of {total_marks})."
                            )
                        }
                    )

        return attrs

    def create(self, validated_data):
        rubric_data = validated_data.pop("rubric", None)
        module = validated_data.get("module")
        if module is not None and not validated_data.get("order"):
            validated_data["order"] = get_next_order(Assignment.objects.filter(module=module))
        validated_data["created_by"] = self.context["request"].user
        assignment = Assignment.objects.create(**validated_data)
        if rubric_data is not None:
            _save_rubric(assignment, rubric_data)
        return assignment

    def update(self, instance, validated_data):
        rubric_data = validated_data.pop("rubric", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if rubric_data is not None:
            _save_rubric(instance, rubric_data)
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
        assignment = validated_data["assignment"]
        return AssignmentAttachment.objects.create(
            assignment=assignment,
            file=file,
            original_name=os.path.basename(file.name),
            file_type=file_type,
            order=get_next_order(AssignmentAttachment.objects.filter(assignment=assignment)),
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


class AssignmentAttachmentOrderEntrySerializer(serializers.Serializer):
    attachment_id = serializers.IntegerField()
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
    ai_review = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id",
            "assignment",
            "student",
            "submitted_at",
            "status",
            "marks",
            "feedback",
            "graded_at",
            "graded_by",
            "files",
            "ai_review",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_assignment(self, obj):
        return {
            "id": obj.assignment_id,
            "title": obj.assignment.title,
            "total_marks": obj.assignment.total_marks,
            "grading_mode": obj.assignment.grading_mode,
        }

    def get_student(self, obj):
        return {"id": obj.student_id, "name": obj.student.name}

    def get_ai_review(self, obj):
        if obj.assignment.grading_mode != Assignment.GradingMode.AI:
            return None
        return latest_review_summary(obj)


class AssignmentGradeSerializer(serializers.Serializer):
    marks = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, default="")
