from django.db.models import Sum
from rest_framework import serializers

from common.ordering import get_next_order
from courses.models import Course
from modules.models import Module

from .models import Choice, Question, Quiz, QuizAnswer, QuizResult


class QuizCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "slug"]
        read_only_fields = fields


class QuizModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "title"]
        read_only_fields = fields


class QuizSerializer(serializers.ModelSerializer):
    course = QuizCourseSerializer(read_only=True)
    module = QuizModuleSerializer(read_only=True)
    total_marks = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "course",
            "module",
            "title",
            "description",
            "passing_score",
            "time_limit_minutes",
            "status",
            "attempts_allowed",
            "available_from",
            "available_until",
            "order",
            "total_marks",
            "short_answer_grading_mode",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_total_marks(self, obj):
        return obj.questions.aggregate(total=Sum("marks"))["total"] or 0


class QuizWriteSerializer(serializers.ModelSerializer):
    module = serializers.PrimaryKeyRelatedField(
        queryset=Module.objects.all(), required=False, allow_null=True
    )
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), required=False)
    order = serializers.IntegerField(min_value=1, required=False)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "course",
            "module",
            "title",
            "description",
            "passing_score",
            "time_limit_minutes",
            "status",
            "attempts_allowed",
            "available_from",
            "available_until",
            "order",
            "short_answer_grading_mode",
        ]
        read_only_fields = ["id", "status"]
        # The model's conditional UniqueConstraint on (module, order) would otherwise make
        # DRF auto-generate a UniqueTogetherValidator that force-requires `module` on every
        # create, even though it's intentionally optional. The DB constraint plus
        # get_next_order()/reorder_quizzes() already guard against collisions.
        validators = []

    def validate(self, attrs):
        module = attrs.get("module", getattr(self.instance, "module", None))
        course = attrs.get("course", getattr(self.instance, "course", None))

        if module is not None:
            attrs["course"] = module.course
        elif not course:
            raise serializers.ValidationError(
                {"course": "Either a course or a module must be provided."}
            )

        available_from = attrs.get("available_from", getattr(self.instance, "available_from", None))
        available_until = attrs.get("available_until", getattr(self.instance, "available_until", None))
        if available_from and available_until and available_until <= available_from:
            raise serializers.ValidationError(
                {"available_until": "Available until must be after available from."}
            )

        return attrs

    def create(self, validated_data):
        module = validated_data.get("module")
        if module is not None and not validated_data.get("order"):
            validated_data["order"] = get_next_order(Quiz.objects.filter(module=module))
        return Quiz.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct"]
        read_only_fields = fields


class ChoiceEntrySerializer(serializers.Serializer):
    text = serializers.CharField()
    is_correct = serializers.BooleanField(default=False)


class ChoiceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct"]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "quiz",
            "text",
            "question_type",
            "marks",
            "order",
            "grading_notes",
            "choices",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class QuestionWriteSerializer(serializers.ModelSerializer):
    choices = ChoiceEntrySerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "marks", "order", "grading_notes", "choices"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        choices = validated_data.pop("choices", [])
        question = Question.objects.create(**validated_data)
        for entry in choices:
            Choice.objects.create(question=question, **entry)
        return question

    def update(self, instance, validated_data):
        choices = validated_data.pop("choices", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if choices is not None:
            instance.choices.all().delete()
            for entry in choices:
                Choice.objects.create(question=instance, **entry)

        return instance


class StudentChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text"]
        read_only_fields = fields


class StudentQuestionSerializer(serializers.ModelSerializer):
    choices = StudentChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "marks", "order", "choices"]
        read_only_fields = fields


class QuizAvailableSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "passing_score",
            "time_limit_minutes",
            "attempts_allowed",
            "available_from",
            "available_until",
            "question_count",
        ]
        read_only_fields = fields


class QuizAnswerEntrySerializer(serializers.Serializer):
    question = serializers.IntegerField()
    selected_choice = serializers.IntegerField(required=False, allow_null=True)
    text_answer = serializers.CharField(required=False, allow_blank=True)


class QuizSubmitSerializer(serializers.Serializer):
    answers = QuizAnswerEntrySerializer(many=True)


class QuizAttemptAutosaveSerializer(serializers.Serializer):
    answers = QuizAnswerEntrySerializer(many=True)


class QuizResultSerializer(serializers.ModelSerializer):
    quiz = serializers.SerializerMethodField()
    attempt_number = serializers.IntegerField(source="attempt.attempt_number", read_only=True)
    attempt_status = serializers.CharField(source="attempt.status", read_only=True)

    class Meta:
        model = QuizResult
        fields = ["id", "quiz", "attempt_number", "attempt_status", "score", "percentage", "is_passed"]
        read_only_fields = fields

    def get_quiz(self, instance):
        return {"id": instance.attempt.quiz_id, "title": instance.attempt.quiz.title}


class QuizOrderEntrySerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)


class QuestionOrderEntrySerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)


class QuizPendingAnswerSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    question = serializers.SerializerMethodField()

    class Meta:
        model = QuizAnswer
        fields = ["id", "attempt", "question", "student", "text_answer", "grading_status"]
        read_only_fields = fields

    def get_student(self, obj):
        return {"id": obj.attempt.student_id, "name": obj.attempt.student.name}

    def get_question(self, obj):
        return {"id": obj.question_id, "text": obj.question.text, "marks": obj.question.marks}


class QuizAnswerGradeSerializer(serializers.Serializer):
    marks_awarded = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, default="")
