from rest_framework import serializers

from .models import DrillOption, DrillQuestion


class DrillOptionSerializer(serializers.ModelSerializer):
    """Option as shown before it has been picked: no score/impact/rationale,
    so a student can't infer the right answer from the network response."""

    class Meta:
        model = DrillOption
        fields = ["id", "key", "text"]
        read_only_fields = fields


class DrillOptionResultSerializer(serializers.ModelSerializer):
    """Full option detail, only ever sent for the option the student picked."""

    class Meta:
        model = DrillOption
        fields = ["id", "key", "text", "impact", "score", "rationale"]
        read_only_fields = fields


class DrillQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = DrillQuestion
        fields = ["id", "scenario", "guidelines", "options"]
        read_only_fields = fields

    def get_options(self, question):
        selected_option_id = self.context.get("selected_option_id")
        options = []
        for option in question.options.order_by("key"):
            if option.id == selected_option_id:
                options.append(DrillOptionResultSerializer(option).data)
            else:
                options.append(DrillOptionSerializer(option).data)
        return options


class DrillAttemptCreateSerializer(serializers.Serializer):
    option_id = serializers.IntegerField()
