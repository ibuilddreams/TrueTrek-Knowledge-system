from rest_framework import serializers

from courses.models import Course
from modules.models import Module

from .models import Choice, Question, Quiz, QuizResult


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
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class QuizWriteSerializer(serializers.ModelSerializer):
    module = serializers.PrimaryKeyRelatedField(queryset=Module.objects.all(), required=True)

    class Meta:
        model = Quiz
        fields = ["id", "module", "title", "description", "passing_score", "time_limit_minutes"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["course"] = validated_data["module"].course
        return Quiz.objects.create(**validated_data)

    def update(self, instance, validated_data):
        module = validated_data.get("module")
        if module is not None:
            validated_data["course"] = module.course

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
        fields = ["id", "quiz", "text", "question_type", "order", "choices", "created_at", "updated_at"]
        read_only_fields = fields


class QuestionWriteSerializer(serializers.ModelSerializer):
    choices = ChoiceEntrySerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "order", "choices"]
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
        fields = ["id", "text", "question_type", "order", "choices"]
        read_only_fields = fields


class QuizAvailableSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = ["id", "title", "description", "passing_score", "time_limit_minutes", "question_count"]
        read_only_fields = fields


class QuizAnswerEntrySerializer(serializers.Serializer):
    question = serializers.IntegerField()
    selected_choice = serializers.IntegerField(required=False, allow_null=True)
    text_answer = serializers.CharField(required=False, allow_blank=True)


class QuizSubmitSerializer(serializers.Serializer):
    answers = QuizAnswerEntrySerializer(many=True)


class QuizResultSerializer(serializers.ModelSerializer):
    quiz = serializers.SerializerMethodField()
    attempt_number = serializers.IntegerField(source="attempt.attempt_number", read_only=True)

    class Meta:
        model = QuizResult
        fields = ["id", "quiz", "attempt_number", "score", "percentage", "is_passed"]
        read_only_fields = fields

    def get_quiz(self, instance):
        return {"id": instance.attempt.quiz_id, "title": instance.attempt.quiz.title}
