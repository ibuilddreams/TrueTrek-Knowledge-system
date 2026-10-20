from django.conf import settings
from rest_framework import serializers

from .models import RolePlayScenario, RolePlaySession, RolePlayTurn
from .services import can_evaluate

# One spoken reply, not an essay. Bounded so a broken or hostile client can't
# push an unbounded payload through to the provider — same reasoning as
# advisor/serializers.py's MAX_SCENARIO_LENGTH.
MAX_TURN_LENGTH = 2000


class RolePlayScenarioSerializer(serializers.ModelSerializer):
    """Admin read shape. `session_count`/`completion_count` are annotated by
    the admin list view and fall back to 0 on a bare instance."""

    relationship_display = serializers.CharField(source="get_relationship_display", read_only=True)
    pressure_type_display = serializers.CharField(source="get_pressure_type_display", read_only=True)
    persona_display = serializers.CharField(source="get_persona_display", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)
    session_count = serializers.IntegerField(read_only=True, default=0)
    completion_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = RolePlayScenario
        fields = [
            "id",
            "code",
            "title",
            "module_code",
            "module_title",
            "relationship",
            "relationship_display",
            "pressure_type",
            "pressure_type_display",
            "key_skill",
            "counterpart_role",
            "setup",
            "opening_message",
            "exercise",
            "ideal_acknowledge",
            "ideal_boundary",
            "ideal_pivot",
            "persona",
            "persona_display",
            "difficulty",
            "difficulty_display",
            "points_reward",
            "order",
            "status",
            "session_count",
            "completion_count",
            "created_at",
            "updated_at",
        ]


class RolePlayScenarioWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePlayScenario
        fields = [
            "code",
            "title",
            "module_code",
            "module_title",
            "relationship",
            "pressure_type",
            "key_skill",
            "counterpart_role",
            "setup",
            "opening_message",
            "exercise",
            "ideal_acknowledge",
            "ideal_boundary",
            "ideal_pivot",
            "persona",
            "difficulty",
            "points_reward",
            "order",
            "status",
        ]

    def validate_code(self, value):
        return value.strip().upper()

    def validate_points_reward(self, value):
        if value < 1:
            raise serializers.ValidationError("A scenario must be worth at least 1 point.")
        return value


class ScenarioBriefSerializer(serializers.ModelSerializer):
    """The scenario as the student sees it *before* they start.

    The three `ideal_*` fields are deliberately absent: they are the answer
    key for this exact conversation, and a student who reads them first is
    transcribing, not practising. They are revealed on the report card once
    the run has been scored — see RolePlaySessionSerializer.get_ideal_response.
    """

    relationship_display = serializers.CharField(source="get_relationship_display", read_only=True)
    pressure_type_display = serializers.CharField(source="get_pressure_type_display", read_only=True)
    persona_display = serializers.CharField(source="get_persona_display", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)

    class Meta:
        model = RolePlayScenario
        fields = [
            "id",
            "code",
            "title",
            "module_code",
            "module_title",
            "relationship",
            "relationship_display",
            "pressure_type",
            "pressure_type_display",
            "key_skill",
            "counterpart_role",
            "setup",
            "exercise",
            "persona",
            "persona_display",
            "difficulty",
            "difficulty_display",
            "points_reward",
        ]


class ScenarioListItemSerializer(ScenarioBriefSerializer):
    """A scenario on the picker, carrying this student's progress against it.

    `best_session` and `active_session_id` are attached by the view (see
    views.ScenarioListView) rather than queried per row, so the list stays a
    fixed number of queries however many scenarios the catalog grows to.
    """

    best_score = serializers.SerializerMethodField()
    passed = serializers.SerializerMethodField()
    attempts = serializers.SerializerMethodField()
    active_session_id = serializers.SerializerMethodField()

    class Meta(ScenarioBriefSerializer.Meta):
        fields = ScenarioBriefSerializer.Meta.fields + [
            "best_score",
            "passed",
            "attempts",
            "active_session_id",
        ]

    def _best(self, obj):
        return (self.context.get("best_by_scenario") or {}).get(obj.id)

    def get_best_score(self, obj):
        best = self._best(obj)
        return best.overall_score if best else None

    def get_passed(self, obj):
        best = self._best(obj)
        return bool(best and best.passed)

    def get_attempts(self, obj):
        return (self.context.get("attempts_by_scenario") or {}).get(obj.id, 0)

    def get_active_session_id(self, obj):
        return (self.context.get("active_by_scenario") or {}).get(obj.id)


class RolePlayTurnSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePlayTurn
        fields = ["id", "speaker", "content", "order", "seconds_from_start", "pressure_level"]


class RolePlaySessionSerializer(serializers.ModelSerializer):
    """The whole scene plus, once scored, the report card."""

    scenario = ScenarioBriefSerializer(read_only=True)
    turns = RolePlayTurnSerializer(many=True, read_only=True)
    persona_display = serializers.CharField(source="get_persona_display", read_only=True)
    can_evaluate = serializers.SerializerMethodField()
    turns_remaining = serializers.SerializerMethodField()
    ideal_response = serializers.SerializerMethodField()
    rubric = serializers.SerializerMethodField()

    class Meta:
        model = RolePlaySession
        fields = [
            "id",
            "scenario",
            "persona",
            "persona_display",
            "status",
            "started_at",
            "completed_at",
            "athlete_turn_count",
            "turns_remaining",
            "counterpart_conceded",
            "can_evaluate",
            "turns",
            "rubric",
            "overall_score",
            "passed",
            "boundary_turn",
            "boundary_seconds",
            "verdict",
            "summary",
            "strengths",
            "improvements",
            "suggested_response",
            "used_fabricated_excuse",
            "fabrication_note",
            "ideal_response",
            "points_awarded",
            "error_message",
            "created_at",
        ]

    def get_can_evaluate(self, obj):
        # The same predicate the evaluate endpoint enforces, so the button's
        # enabled state and the server's answer can never disagree.
        return can_evaluate(obj)

    def get_turns_remaining(self, obj):
        return max(0, settings.ROLEPLAY_MAX_ATHLETE_TURNS - obj.athlete_turn_count)

    def get_ideal_response(self, obj):
        """The A.B.P. model answer — revealed only once the run is scored, so
        it reads as feedback rather than as a script to copy."""
        if obj.status != RolePlaySession.SessionStatus.COMPLETED:
            return None
        scenario = obj.scenario
        return {
            "acknowledge": scenario.ideal_acknowledge,
            "boundary": scenario.ideal_boundary,
            "pivot": scenario.ideal_pivot,
        }

    def get_rubric(self, obj):
        """The three criteria as one ordered list — label, score and the
        grader's evidence together, which is how the report card renders them
        and keeps the frontend from having to re-pair six fields."""
        if obj.overall_score is None:
            return []
        notes = obj.criteria_notes if isinstance(obj.criteria_notes, dict) else {}
        return [
            {
                "key": "time_to_boundary",
                "label": "Time to Boundary",
                "score": obj.time_to_boundary_score,
                "note": notes.get("time_to_boundary", ""),
            },
            {
                "key": "tone_control",
                "label": "Tone Control",
                "score": obj.tone_control_score,
                "note": notes.get("tone_control", ""),
            },
            {
                "key": "deflection_to_policy",
                "label": "Deflection to Policy",
                "score": obj.deflection_to_policy_score,
                "note": notes.get("deflection_to_policy", ""),
            },
        ]


class RolePlaySessionListSerializer(serializers.ModelSerializer):
    """Lighter shape for the history list — the transcript and the findings
    arrays belong on the detail screen and would bloat every page."""

    scenario_id = serializers.IntegerField(source="scenario.id", read_only=True)
    scenario_title = serializers.CharField(source="scenario.title", read_only=True)
    scenario_code = serializers.CharField(source="scenario.code", read_only=True)
    key_skill = serializers.CharField(source="scenario.key_skill", read_only=True)

    class Meta:
        model = RolePlaySession
        fields = [
            "id",
            "scenario_id",
            "scenario_title",
            "scenario_code",
            "key_skill",
            "status",
            "overall_score",
            "passed",
            "verdict",
            "points_awarded",
            "athlete_turn_count",
            "created_at",
            "completed_at",
        ]


class StartSessionSerializer(serializers.Serializer):
    scenario_id = serializers.IntegerField()


class SubmitTurnSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=MAX_TURN_LENGTH, trim_whitespace=True)

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Type what you want to say before sending.")
        return value


class AdminRolePlaySessionSerializer(serializers.ModelSerializer):
    """One run as an admin sees it in the activity feed.

    Flattens the student and scenario onto the row, like
    `quests.AdminQuestSubmissionSerializer` — this backs a table, and every
    column here is one an admin scans or filters by.
    """

    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)
    scenario_id = serializers.IntegerField(source="scenario.id", read_only=True)
    scenario_code = serializers.CharField(source="scenario.code", read_only=True)
    scenario_title = serializers.CharField(source="scenario.title", read_only=True)
    persona_display = serializers.CharField(source="get_persona_display", read_only=True)

    class Meta:
        model = RolePlaySession
        fields = [
            "id",
            "student_id",
            "student_name",
            "student_email",
            "scenario_id",
            "scenario_code",
            "scenario_title",
            "persona",
            "persona_display",
            "status",
            "athlete_turn_count",
            "overall_score",
            "time_to_boundary_score",
            "tone_control_score",
            "deflection_to_policy_score",
            "passed",
            "used_fabricated_excuse",
            "verdict",
            "points_awarded",
            "created_at",
            "completed_at",
        ]
