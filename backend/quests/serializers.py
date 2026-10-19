from rest_framework import serializers

from .models import DailyQuestAssignment, Quest


class QuestSerializer(serializers.ModelSerializer):
    """Read shape for the admin catalog. `assignment_count`/`completion_count`
    are annotated by the list view (see views.AdminQuestListCreateView) and
    fall back to 0 for the detail view, which serializes a bare instance."""

    category_display = serializers.CharField(source="get_category_display", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)
    assignment_count = serializers.IntegerField(read_only=True, default=0)
    completion_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Quest
        fields = [
            "id",
            "title",
            "instructions",
            "category",
            "category_display",
            "difficulty",
            "difficulty_display",
            "points_reward",
            "estimated_minutes",
            "proof_hint",
            "status",
            "assignment_count",
            "completion_count",
            "created_at",
            "updated_at",
        ]


class QuestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quest
        fields = [
            "title",
            "instructions",
            "category",
            "difficulty",
            "points_reward",
            "estimated_minutes",
            "proof_hint",
            "status",
        ]

    def validate_points_reward(self, value):
        if value < 1:
            raise serializers.ValidationError("A quest must be worth at least 1 point.")
        return value

    def validate_estimated_minutes(self, value):
        if value < 1:
            raise serializers.ValidationError("Estimated time must be at least 1 minute.")
        return value


class QuestSummarySerializer(serializers.ModelSerializer):
    """The quest as the student sees it, nested inside their assignment."""

    category_display = serializers.CharField(source="get_category_display", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)

    class Meta:
        model = Quest
        fields = [
            "id",
            "title",
            "instructions",
            "category",
            "category_display",
            "difficulty",
            "difficulty_display",
            "points_reward",
            "estimated_minutes",
            "proof_hint",
        ]


class DailyQuestAssignmentSerializer(serializers.ModelSerializer):
    quest = QuestSummarySerializer(read_only=True)
    proof_file_url = serializers.SerializerMethodField()

    class Meta:
        model = DailyQuestAssignment
        fields = [
            "id",
            "quest",
            "assigned_date",
            "status",
            "points_awarded",
            "completed_at",
            "reflection",
            "proof_url",
            "proof_file_url",
            "proof_original_name",
        ]

    def get_proof_file_url(self, obj):
        if not obj.proof_file:
            return None
        request = self.context.get("request")
        url = obj.proof_file.url
        return request.build_absolute_uri(url) if request else url


class CompleteQuestSerializer(serializers.Serializer):
    """Completion payload. Every field is optional — proof is never required
    (completion is self-attested), so an empty body is a valid "I did it"."""

    reflection = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    proof_url = serializers.URLField(required=False, allow_blank=True)
    proof_file = serializers.FileField(required=False, allow_null=True)


class AdminQuestSubmissionSerializer(serializers.ModelSerializer):
    """One student's assignment as an admin sees it.

    Flattens the student and quest onto the row rather than nesting whole
    objects: this backs a table, and every column here is one the admin
    filters or scans by. The proof fields are included because reviewing what
    a student actually submitted is the point of the screen — even though
    nothing is gated on it (completion is self-attested).
    """

    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)
    quest_id = serializers.IntegerField(source="quest.id", read_only=True)
    quest_title = serializers.CharField(source="quest.title", read_only=True)
    quest_category = serializers.CharField(source="quest.get_category_display", read_only=True)
    quest_difficulty = serializers.CharField(source="quest.get_difficulty_display", read_only=True)
    proof_file_url = serializers.SerializerMethodField()

    class Meta:
        model = DailyQuestAssignment
        fields = [
            "id",
            "student_id",
            "student_name",
            "student_email",
            "quest_id",
            "quest_title",
            "quest_category",
            "quest_difficulty",
            "assigned_date",
            "status",
            "points_awarded",
            "completed_at",
            "reflection",
            "proof_url",
            "proof_file_url",
            "proof_original_name",
        ]

    def get_proof_file_url(self, obj):
        if not obj.proof_file:
            return None
        request = self.context.get("request")
        url = obj.proof_file.url
        return request.build_absolute_uri(url) if request else url
