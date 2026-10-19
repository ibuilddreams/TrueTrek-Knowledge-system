from django.conf import settings
from django.db import models

from common.models import BaseModel, Status


class Quest(BaseModel):
    """An admin-authored, real-world brand-building task from the quest
    catalog — "delete three old posts that no longer represent your core
    values", "post a 15-second video highlighting a teammate".

    A Quest is a *template*, never a student's copy of one: what a given
    student was asked to do on a given day lives in `DailyQuestAssignment`.
    That split is what lets an admin edit or archive a quest without
    rewriting history, and is why assignments reference this row with
    `on_delete=PROTECT` (see `DailyQuestAssignment.quest`).

    Reuses `common.Status` (DRAFT/PUBLISHED/ARCHIVED) rather than a bespoke
    boolean, matching `rewards.Reward` — archiving hides a quest from future
    assignment without touching the assignments already pointing at it.
    """

    class Category(models.TextChoices):
        AUDIT = "AUDIT", "Brand Audit"
        CONTENT = "CONTENT", "Content Creation"
        ENGAGEMENT = "ENGAGEMENT", "Engagement"
        PROFILE = "PROFILE", "Profile Optimization"
        OUTREACH = "OUTREACH", "Outreach & Networking"
        REFLECTION = "REFLECTION", "Reflection"

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD = "HARD", "Hard"

    title = models.CharField(max_length=255)
    instructions = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.CONTENT)
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.EASY)
    points_reward = models.PositiveIntegerField(default=10)
    estimated_minutes = models.PositiveIntegerField(default=10)
    # Shown under the (always optional) proof field on the student's quest
    # card — "attach a screenshot of your updated bio". Blank means the
    # generic prompt is used; there is deliberately no "proof required" mode,
    # because completion is self-attested and auto-awarded with no admin
    # review queue (see quests.services.complete_quest).
    proof_hint = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["category", "title"]
        indexes = [models.Index(fields=["status", "category"])]

    def __str__(self):
        return self.title


class DailyQuestAssignment(BaseModel):
    """One quest handed to one student on one day.

    `unique_together(student, quest, assigned_date)` is the idempotency
    guard for `services.get_or_assign_todays_quests` — two concurrent loads
    of the Quests tab on the student's first visit of the day can't produce
    two sets of rows. The daily set itself is sized by
    `settings.DAILY_QUEST_COUNT`.
    """

    class AssignmentStatus(models.TextChoices):
        ASSIGNED = "ASSIGNED", "Assigned"
        COMPLETED = "COMPLETED", "Completed"
        SKIPPED = "SKIPPED", "Skipped"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quest_assignments"
    )
    # PROTECT, not CASCADE: a completed assignment is the evidence behind a
    # points ledger entry, so deleting a quest must never silently erase the
    # work a student already did and was paid for. Admins archive instead.
    quest = models.ForeignKey(Quest, on_delete=models.PROTECT, related_name="assignments")
    assigned_date = models.DateField()
    status = models.CharField(
        max_length=20, choices=AssignmentStatus.choices, default=AssignmentStatus.ASSIGNED
    )

    # Captured at completion time rather than read back off `quest` so a
    # later edit to the catalog can't retroactively change what a student
    # was paid — mirrors `rewards.RewardRedemption.points_cost`.
    points_awarded = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Optional, self-attested proof. Either, both or neither may be present.
    reflection = models.TextField(blank=True)
    proof_file = models.FileField(upload_to="quests/proof/%Y/%m/", blank=True, null=True)
    proof_original_name = models.CharField(max_length=255, blank=True)
    proof_url = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ["-assigned_date", "quest__title"]
        indexes = [models.Index(fields=["student", "-assigned_date"])]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "quest", "assigned_date"],
                name="one_assignment_per_student_quest_day",
            ),
        ]

    def __str__(self):
        return f"{self.student} - {self.quest_id} ({self.assigned_date})"
