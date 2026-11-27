from django.db.models import Sum
from rest_framework import serializers

from common.ordering import get_next_order
from courses.models import Course
from modules.models import Module

from .constants import MAX_QUESTIONS_PER_QUIZ
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
            "number_of_questions",
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
        # Template questions only — obj.questions also includes every student's
        # accumulated AI-regenerated retry questions once any attempt #2+ exists.
        return obj.questions.filter(attempt__isnull=True).aggregate(total=Sum("marks"))["total"] or 0


class QuizWriteSerializer(serializers.ModelSerializer):
    module = serializers.PrimaryKeyRelatedField(
        queryset=Module.objects.all(), required=False, allow_null=True
    )
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), required=False)
    order = serializers.IntegerField(min_value=1, required=False)
    # Bound matches ai_courses' questions_per_quiz — how many questions the original
    # quiz should have, and how many an AI-regenerated retry produces each time. A
    # retry asks for them in parallel batches (quizzes/ai_generation.py), which is
    # what keeps a 70-question set inside one synchronous request's budget.
    number_of_questions = serializers.IntegerField(
        min_value=1, max_value=MAX_QUESTIONS_PER_QUIZ, required=False
    )

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
            "number_of_questions",
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
    """The student-facing view of one question *as this attempt serves it*.

    Both order-carrying fields are deliberately the attempt's and not the
    quiz's: `choices` reads the per-attempt choice order and `order` is the
    question's position in this attempt, not its authored `Question.order` —
    which, once the attempt is shuffled, no longer describes anything the
    student can see. Both are prepared by
    `services.get_attempt_question_set`, the only supported way to build the
    objects this serializer is given; `order` would otherwise be a number a
    client could sort by and quietly undo the shuffle with.
    """

    choices = serializers.SerializerMethodField()
    order = serializers.IntegerField(source="display_order", read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "marks", "order", "choices"]
        read_only_fields = fields

    def get_choices(self, obj):
        return StudentChoiceSerializer(obj.attempt_choices, many=True).data


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
            "number_of_questions",
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
    points_awarded = serializers.SerializerMethodField()

    class Meta:
        model = QuizResult
        fields = [
            "id",
            "quiz",
            "attempt_number",
            "attempt_status",
            "score",
            "percentage",
            "is_passed",
            "points_awarded",
        ]
        read_only_fields = fields

    def get_quiz(self, instance):
        return {"id": instance.attempt.quiz_id, "title": instance.attempt.quiz.title}

    def get_points_awarded(self, instance):
        """Read back off the ledger rather than recomputed from the score, so
        this can only ever say what the student was actually paid — including
        0 for an attempt whose band was never awarded (a third try, or a score
        that has since been re-graded down). See quizzes/points.py.

        Imported here because `rewards` has a foreign key back into this app.
        """
        from rewards.models import PointsTransaction

        awarded = (
            PointsTransaction.objects.filter(
                quiz_attempt_id=instance.attempt_id,
                transaction_type=PointsTransaction.TransactionType.QUIZ_REWARD,
            )
            .values_list("amount", flat=True)
            .first()
        )
        return awarded or 0


class QuizOrderEntrySerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)


class QuizTitleSuggestionRequestSerializer(serializers.Serializer):
    module = serializers.IntegerField()
    draft_title = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default="", trim_whitespace=True
    )


class QuizDescriptionSuggestionRequestSerializer(serializers.Serializer):
    module = serializers.IntegerField()
    title = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default="", trim_whitespace=True
    )
    draft_description = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, default="", trim_whitespace=True
    )


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
