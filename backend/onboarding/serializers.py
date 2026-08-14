from rest_framework import serializers

from pathways.models import Pathway

from .models import (
    OnboardingProgress,
    Question,
    QuestionOption,
    QuestionOptionPathwayWeight,
    QuestionnaireAnswer,
)


class QuestionOptionPathwaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pathway
        fields = ["id", "name"]
        read_only_fields = fields


class QuestionOptionPathwayWeightSerializer(serializers.ModelSerializer):
    pathway = QuestionOptionPathwaySerializer(read_only=True)

    class Meta:
        model = QuestionOptionPathwayWeight
        fields = ["id", "pathway", "weight"]
        read_only_fields = fields


class QuestionOptionAdminSerializer(serializers.ModelSerializer):
    """Full option detail, including scoring weights — admin-only."""

    pathway_weights = QuestionOptionPathwayWeightSerializer(many=True, read_only=True)

    class Meta:
        model = QuestionOption
        fields = ["id", "text", "order", "pathway_weights"]
        read_only_fields = fields


class QuestionAdminSerializer(serializers.ModelSerializer):
    options = QuestionOptionAdminSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "order", "is_multi_select", "is_active", "options", "created_at", "updated_at"]
        read_only_fields = fields


class QuestionOptionPublicSerializer(serializers.ModelSerializer):
    """What the questionnaire wizard shows an answering user — no scoring weights."""

    class Meta:
        model = QuestionOption
        fields = ["id", "text", "order"]
        read_only_fields = fields


class QuestionPublicSerializer(serializers.ModelSerializer):
    """`selected_option_ids` reflects the requesting user's already-saved
    answer (if any), keyed from `context["answered_map"]` — lets the wizard
    prefill and show a question as already completed on resume."""

    options = QuestionOptionPublicSerializer(many=True, read_only=True)
    selected_option_ids = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ["id", "text", "order", "is_multi_select", "options", "selected_option_ids"]
        read_only_fields = fields

    def get_selected_option_ids(self, obj):
        option_id = (self.context.get("answered_map") or {}).get(obj.id)
        return [option_id] if option_id is not None else []


class QuestionOptionWeightInputSerializer(serializers.Serializer):
    pathway = serializers.PrimaryKeyRelatedField(queryset=Pathway.objects.all())
    weight = serializers.IntegerField(min_value=1)


class QuestionOptionInputSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=255)
    order = serializers.IntegerField(min_value=1, required=False)
    pathway_weights = QuestionOptionWeightInputSerializer(many=True, required=False)


class QuestionWriteSerializer(serializers.ModelSerializer):
    options = QuestionOptionInputSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ["id", "text", "order", "is_multi_select", "is_active", "options"]
        read_only_fields = ["id"]

    def validate_options(self, value):
        if value and len(value) < 2:
            raise serializers.ValidationError("Provide at least two options for a question.")
        return value

    def _write_options(self, question, options_data):
        question.options.all().delete()
        for index, option_data in enumerate(options_data, start=1):
            weights_data = option_data.pop("pathway_weights", [])
            option = QuestionOption.objects.create(
                question=question,
                text=option_data["text"],
                order=option_data.get("order", index),
            )
            for weight_data in weights_data:
                QuestionOptionPathwayWeight.objects.create(
                    option=option, pathway=weight_data["pathway"], weight=weight_data["weight"]
                )

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        question = Question.objects.create(**validated_data)
        if options_data:
            self._write_options(question, options_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options_data is not None:
            self._write_options(instance, options_data)
        return instance


class AnswerEntrySerializer(serializers.Serializer):
    question = serializers.PrimaryKeyRelatedField(queryset=Question.objects.filter(is_active=True))
    option = serializers.PrimaryKeyRelatedField(queryset=QuestionOption.objects.all())

    def validate(self, attrs):
        if attrs["option"].question_id != attrs["question"].id:
            raise serializers.ValidationError(
                {"option": "This option does not belong to the given question."}
            )
        return attrs


class QuestionnaireSubmitSerializer(serializers.Serializer):
    answers = AnswerEntrySerializer(many=True, allow_empty=False)


class QuestionnaireAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionnaireAnswer
        fields = ["id", "question", "option", "created_at"]
        read_only_fields = fields


class OnboardingProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingProgress
        fields = ["step", "selected_pathway_ids", "updated_at"]
        read_only_fields = ["updated_at"]

    def validate_selected_pathway_ids(self, value):
        if not isinstance(value, list) or not all(isinstance(item, int) for item in value):
            raise serializers.ValidationError("Must be a list of pathway ids.")
        return value
