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
