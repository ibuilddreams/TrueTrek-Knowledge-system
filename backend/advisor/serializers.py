from rest_framework import serializers

# Generous but bounded — this is a single chat turn (persona system prompt +
# user query), not a document upload. Keeps a malicious/broken client from
# sending an unbounded payload straight through to the Gemini API.
MAX_SCENARIO_LENGTH = 4000
MAX_SYSTEM_PROMPT_LENGTH = 4000
MAX_ADVISOR_NAME_LENGTH = 200


class AdvisorChatRequestSerializer(serializers.Serializer):
    scenario = serializers.CharField(max_length=MAX_SCENARIO_LENGTH, trim_whitespace=True)
    systemPrompt = serializers.CharField(max_length=MAX_SYSTEM_PROMPT_LENGTH, trim_whitespace=True)
    advisorName = serializers.CharField(
        max_length=MAX_ADVISOR_NAME_LENGTH, required=False, allow_blank=True, default=""
    )

    def validate_scenario(self, value):
        if not value.strip():
            raise serializers.ValidationError("scenario must not be blank.")
        return value

    def validate_systemPrompt(self, value):
        if not value.strip():
            raise serializers.ValidationError("systemPrompt must not be blank.")
        return value
