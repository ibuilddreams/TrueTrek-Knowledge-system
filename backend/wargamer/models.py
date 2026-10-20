from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from common.models import BaseModel, Status


class RolePlayScenario(BaseModel):
    """One pressure situation an athlete practises against — the admin-authored
    template, never a student's run of it (that is `RolePlaySession`).

    Shaped like `quests.Quest`: a catalog row with `common.Status`, referenced
    from student rows with `on_delete=PROTECT`, so editing or archiving a
    scenario never rewrites what a student already did or was paid for.

    `opening_message` is authored rather than generated. The first thing the
    counterpart says is the scenario — making it deterministic means every
    student meets the same pitch, the scene starts instantly, and starting a
    session costs no model call at all.

    The three `ideal_*` fields are the A.B.P. model answer from the brief. They
    are deliberately *not* sent to the counterpart persona (it would then be
    negotiating against its own answer key) and are revealed to the student
    only after they have been scored.
    """

    class Relationship(models.TextChoices):
        FAMILY = "FAMILY", "Family"
        FRIENDS = "FRIENDS", "Friends"
        COMMUNITY = "COMMUNITY", "Community"

    class PressureType(models.TextChoices):
        FINANCIAL = "FINANCIAL", "Money"
        ACCESS = "ACCESS", "Access"
        TIME = "TIME", "Time & Energy"

    class Persona(models.TextChoices):
        """How the counterpart pushes back.

        GUILT_TRIP is the default on purpose: all three of the client's
        scenarios turn on emotional debt ("I bought your cleats", "you're
        changing on us", "people are saying you think you're too good"), and a
        persona that is persistent without being hostile is the one that keeps
        the exercise realistic. The other three exist so an admin can raise the
        difficulty on a scenario deliberately, not by accident.
        """

        GUILT_TRIP = "GUILT_TRIP", "Guilt-tripping"
        AGGRESSIVE = "AGGRESSIVE", "Aggressive"
        PASSIVE_AGGRESSIVE = "PASSIVE_AGGRESSIVE", "Passive-aggressive"
        PERSISTENT = "PERSISTENT", "Persistent negotiator"

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD = "HARD", "Hard"

    # Natural key — "LS-302-S1". `seeddata` upserts on it, so renaming a
    # scenario's title never duplicates the row.
    code = models.CharField(max_length=30, unique=True)
    title = models.CharField(max_length=255)
    # The module this scenario belongs to, e.g. "LS-302 Tactical Wargamer: The
    # 'No' Muscle". Stored per scenario rather than in a Module table because
    # there is exactly one module today and a second one would be a label, not
    # a new relationship — see the module summary in services.get_module_stats.
    module_code = models.CharField(max_length=30, default="LS-302")
    module_title = models.CharField(max_length=255, default='Tactical Wargamer: The "No" Muscle')

    relationship = models.CharField(max_length=20, choices=Relationship.choices)
    pressure_type = models.CharField(max_length=20, choices=PressureType.choices)
    # "Financial boundaries" — the one-line skill the scenario trains, shown on
    # the scenario card and in the student's module summary.
    key_skill = models.CharField(max_length=120)
    # Who the AI plays: "Older cousin", "Childhood friends", "Community figure".
    counterpart_role = models.CharField(max_length=120)

    setup = models.TextField(help_text="The situation, in the student's own second person.")
    opening_message = models.TextField(help_text="The counterpart's first line — authored, not generated.")
    exercise = models.TextField(help_text="What the athlete has to pull off.")

    ideal_acknowledge = models.TextField(blank=True)
    ideal_boundary = models.TextField(blank=True)
    ideal_pivot = models.TextField(blank=True)

    persona = models.CharField(max_length=25, choices=Persona.choices, default=Persona.GUILT_TRIP)
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    points_reward = models.PositiveIntegerField(default=50)
    # A sort hint an admin types in the scenario form. There is no drag-to-
    # reorder endpoint for scenarios, so this intentionally carries none of the
    # staged-offset machinery the nested-content ordering convention needs.
    order = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["order", "code"]
        indexes = [models.Index(fields=["status", "order"])]

    def __str__(self):
        return f"{self.code} — {self.title}"


class RolePlaySession(BaseModel):
    """One student's run at one scenario: the transcript lives in `turns`, the
    report card lives on this row.

    A student may hold at most one IN_PROGRESS session per scenario — enforced
    by the partial unique constraint below, so `services.start_session` can
    resume an abandoned scene instead of fanning out model calls. Across
    scenarios they may have several, because leaving scenario 1 half-finished
    to try scenario 2 and coming back is normal use, not abuse.

    Every evaluation field is nullable and written in one go when the session
    reaches COMPLETED; nothing here is ever edited afterwards, because
    `points_awarded` has already been paid into the rewards ledger against it.
    """

    class SessionStatus(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        # Set for the duration of the scoring call, so a failed evaluation
        # leaves a row that says "scoring didn't finish" and can be retried,
        # rather than one that silently looks unfinished.
        EVALUATING = "EVALUATING", "Evaluating"
        COMPLETED = "COMPLETED", "Completed"
        ABANDONED = "ABANDONED", "Abandoned"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="roleplay_sessions"
    )
    # PROTECT for the same reason quests uses it: a completed session is the
    # evidence behind a points ledger row. Admins archive a scenario instead.
    scenario = models.ForeignKey(RolePlayScenario, on_delete=models.PROTECT, related_name="sessions")
    # Snapshotted at start: changing a scenario's persona later must not
    # relabel how a student was already pressured.
    persona = models.CharField(max_length=25, choices=RolePlayScenario.Persona.choices)
    status = models.CharField(
        max_length=20, choices=SessionStatus.choices, default=SessionStatus.IN_PROGRESS
    )

    started_at = models.DateTimeField()
    last_activity_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    athlete_turn_count = models.PositiveSmallIntegerField(default=0)
    # True once the counterpart stops pushing — the model reports it per turn
    # (see prompts.TURN_RESPONSE_SCHEMA), which is what lets the UI say "they
    # backed down" instead of leaving the student guessing when to stop.
    counterpart_conceded = models.BooleanField(default=False)

    # --- Rubric, all written together when status becomes COMPLETED ---------
    time_to_boundary_score = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    tone_control_score = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    deflection_to_policy_score = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    # Averaged from the three above in services.evaluate_session — never read
    # from the provider, so the model cannot decide its own headline number.
    overall_score = models.PositiveSmallIntegerField(null=True, blank=True)
    passed = models.BooleanField(default=False)

    # Which athlete turn first carried an unambiguous "no" (1-based), and how
    # many seconds into the scene that was. The turn index is the model's
    # judgement; the seconds are measured server-side from `started_at` (see
    # RolePlayTurn.seconds_from_start) and are never client-supplied.
    boundary_turn = models.PositiveSmallIntegerField(null=True, blank=True)
    boundary_seconds = models.PositiveIntegerField(null=True, blank=True)

    # {"time_to_boundary": "...", "tone_control": "...", "deflection_to_policy": "..."}
    # — the grader's one-line evidence for each score, kept beside the three
    # score columns rather than as three more TextFields: nothing queries into
    # them, they are read back wholesale to render the report card, and the
    # scores themselves stay real columns because the admin screen averages
    # them across students.
    criteria_notes = models.JSONField(default=dict, blank=True)

    verdict = models.CharField(max_length=255, blank=True)
    summary = models.TextField(blank=True)
    # [{"title": str, "detail": str}]
    strengths = models.JSONField(default=list, blank=True)
    improvements = models.JSONField(default=list, blank=True)
    # A rewritten version of what the athlete should have said, in A.B.P. order.
    suggested_response = models.TextField(blank=True)

    # The brief's standing coaching point: a boundary that leans on an invented
    # authority ("my agent won't let me") is not sustainable — a real schedule,
    # team rule or budget the athlete actually keeps is. Flagged separately
    # from the rubric so it reads as coaching, not as a deduction twice over.
    used_fabricated_excuse = models.BooleanField(default=False)
    fabrication_note = models.TextField(blank=True)

    points_awarded = models.PositiveIntegerField(default=0)
    provider = models.CharField(max_length=50, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["student", "-created_at"])]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "scenario"],
                condition=models.Q(status="IN_PROGRESS"),
                name="one_active_roleplay_per_student_scenario",
            ),
        ]

    def __str__(self):
        return f"{self.student} — {self.scenario_id} ({self.status})"


class RolePlayTurn(BaseModel):
    """One line of the scene.

    `order` is unique per session, which is what makes a double-tapped "Send"
    a database error rather than two athlete messages answering each other —
    see services.submit_turn.
    """

    class Speaker(models.TextChoices):
        COUNTERPART = "COUNTERPART", "Counterpart"
        ATHLETE = "ATHLETE", "Athlete"

    session = models.ForeignKey(RolePlaySession, on_delete=models.CASCADE, related_name="turns")
    speaker = models.CharField(max_length=20, choices=Speaker.choices)
    content = models.TextField()
    order = models.PositiveSmallIntegerField()
    # Seconds between the session starting and this line being written,
    # measured on the server. Used to show the athlete how long they took to
    # reach a boundary; the rubric's own judgement of *whether* they reached
    # one is the model's (see RolePlaySession.boundary_turn).
    seconds_from_start = models.PositiveIntegerField(default=0)
    # How hard the counterpart leaned on this line, 1-5, as reported by the
    # model. Null on the authored opening line and on every athlete turn.
    pressure_level = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["session", "order"]
        constraints = [
            models.UniqueConstraint(fields=["session", "order"], name="unique_roleplay_turn_order_per_session"),
        ]

    def __str__(self):
        return f"{self.session_id}#{self.order} {self.speaker}"
