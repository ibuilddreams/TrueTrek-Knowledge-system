from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from common.models import BaseModel, Status


class DrillQuestion(BaseModel):
    scenario = models.TextField()
    guidelines = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.scenario[:60]


class DrillOption(BaseModel):
    question = models.ForeignKey(DrillQuestion, on_delete=models.CASCADE, related_name="options")
    key = models.CharField(max_length=1)
    text = models.TextField()
    impact = models.TextField()
    rationale = models.TextField()
    score = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])

    class Meta:
        ordering = ["question", "key"]
        constraints = [
            models.UniqueConstraint(fields=["question", "key"], name="unique_drill_option_key_per_question"),
        ]

    def __str__(self):
        return f"{self.question_id} - {self.key}"


class DrillAttempt(BaseModel):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="drill_attempts"
    )
    question = models.ForeignKey(DrillQuestion, on_delete=models.CASCADE, related_name="attempts")
    selected_option = models.ForeignKey(DrillOption, on_delete=models.CASCADE, related_name="attempts")
    attempt_date = models.DateField()
    score_awarded = models.PositiveSmallIntegerField()
    xp_earned = models.PositiveIntegerField()

    class Meta:
        ordering = ["-attempt_date"]
        constraints = [
            models.UniqueConstraint(fields=["student", "attempt_date"], name="one_drill_attempt_per_day"),
        ]

    def __str__(self):
        return f"{self.student} - {self.attempt_date}"


# ---------------------------------------------------------------------------
# Phase 1 addendum — AI-generated + admin-scheduled Daily Drills.
#
# DrillQuestion/DrillOption/DrillAttempt above are kept exactly as they were
# and are never migrated away — they now serve as the "legacy bank", the
# last-resort fallback `resolve_todays_drill()` (services.py) reaches for when
# neither an admin-scheduled drill nor an AI generation is available for a
# given day. This preserves 100% of the original, already-tested behavior
# (including its own score-scaled XP formula) rather than deleting it.
# ---------------------------------------------------------------------------


class AdminDrillSchedule(BaseModel):
    """A video + short quiz Daily Drill an admin schedules for a specific
    future date. `scheduled_date` is unique — only one admin drill can be
    live on a given day, so `resolve_todays_drill()` never has to pick among
    several."""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to="daily_drills/", blank=True, null=True)
    scheduled_date = models.DateField(unique=True)
    reward_points = models.PositiveIntegerField()
    passing_score_percent = models.PositiveSmallIntegerField(default=60)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["-scheduled_date"]

    def __str__(self):
        return f"{self.title} ({self.scheduled_date})"


class AdminDrillQuizQuestion(BaseModel):
    """One question in an admin-scheduled drill's short quiz. Like
    `onboarding.Question`'s options, the whole question set is replaced
    wholesale on every schedule update rather than diffed — see
    `AdminDrillScheduleWriteSerializer._write_quiz_questions`."""

    schedule = models.ForeignKey(AdminDrillSchedule, on_delete=models.CASCADE, related_name="quiz_questions")
    text = models.TextField()
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ["schedule", "order"]

    def __str__(self):
        return self.text[:60]


class AdminDrillQuizChoice(BaseModel):
    question = models.ForeignKey(AdminDrillQuizQuestion, on_delete=models.CASCADE, related_name="choices")
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ["question", "order"]

    def __str__(self):
        return f"{self.question_id} - {self.text[:40]}"


class AIDrillGeneration(BaseModel):
    """A single Gemini-generated Daily Drill question, persisted the first
    time it's generated for a (student, date) pair — `unique_together`
    enforced at the DB level so a retried/concurrent request can never call
    Gemini twice or produce two rows for the same day (see §10/§37 of the
    brief: never regenerate on every page refresh, never call Gemini
    needlessly). Completion state lives directly on this row rather than in a
    separate table since it's already 1:1 with (student, date)."""

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD = "HARD", "Hard"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_drill_generations"
    )
    drill_date = models.DateField()
    title = models.CharField(max_length=255)
    question = models.TextField()
    context = models.TextField(blank=True)
    options = models.JSONField()  # [{"key": "A", "text": "..."}, ...]
    correct_answer = models.CharField(max_length=1)
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    topic = models.CharField(max_length=255, blank=True)
    content_fingerprint = models.CharField(max_length=64, blank=True, db_index=True)
    provider = models.CharField(max_length=50, blank=True)
    model_name = models.CharField(max_length=100, blank=True)

    is_completed = models.BooleanField(default=False)
    selected_key = models.CharField(max_length=1, blank=True)
    points_awarded = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-drill_date"]
        constraints = [
            models.UniqueConstraint(fields=["student", "drill_date"], name="one_ai_drill_per_student_per_day"),
        ]

    def __str__(self):
        return f"{self.student} - {self.drill_date}"


class AdminDrillProgress(BaseModel):
    """A student's progress against one `AdminDrillSchedule` — video watch
    percentage, quiz answers/score, and completion/points state.
    `unique_together(student, schedule)` is the duplicate-completion guard
    for this path, mirroring `DrillAttempt`'s one-per-day constraint and
    `AIDrillGeneration`'s one-per-day constraint."""

    class ProgressStatus(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_drill_progress"
    )
    schedule = models.ForeignKey(AdminDrillSchedule, on_delete=models.CASCADE, related_name="student_progress")
    status = models.CharField(max_length=20, choices=ProgressStatus.choices, default=ProgressStatus.IN_PROGRESS)
    video_progress_percent = models.PositiveSmallIntegerField(default=0)
    quiz_answers = models.JSONField(null=True, blank=True)
    score_percent = models.PositiveSmallIntegerField(null=True, blank=True)
    attempts_count = models.PositiveIntegerField(default=0)
    points_awarded = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "schedule"], name="one_progress_per_student_per_schedule"),
        ]

    def __str__(self):
        return f"{self.student} - {self.schedule_id} ({self.status})"
