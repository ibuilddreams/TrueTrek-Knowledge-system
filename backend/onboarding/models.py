from django.conf import settings
from django.db import models

from common.models import BaseModel
from pathways.models import Pathway


class Question(BaseModel):
    text = models.CharField(max_length=500)
    order = models.PositiveIntegerField(default=0)
    is_multi_select = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.text


class QuestionOption(BaseModel):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["question", "order"]

    def __str__(self):
        return self.text


class QuestionOptionPathwayWeight(BaseModel):
    option = models.ForeignKey(QuestionOption, on_delete=models.CASCADE, related_name="pathway_weights")
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="question_weights")
    weight = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ("option", "pathway")

    def __str__(self):
        return f"{self.option} -> {self.pathway} ({self.weight})"


class QuestionnaireAnswer(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="questionnaire_answers"
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    option = models.ForeignKey(QuestionOption, on_delete=models.CASCADE, related_name="answers")

    class Meta:
        unique_together = ("user", "question")

    def __str__(self):
        return f"{self.user} -> {self.question}: {self.option}"


class OnboardingProgress(BaseModel):
    """Tracks where a user currently is in the onboarding wizard (steps that
    come *after* the questionnaire, whose answers are already durably stored
    in QuestionnaireAnswer) — so refreshing, closing the browser, or logging
    in again resumes exactly where they left off instead of restarting."""

    class Step(models.TextChoices):
        QUESTIONNAIRE = "QUESTIONNAIRE", "Questionnaire"
        RECOMMENDATION = "RECOMMENDATION", "Recommendation"
        PREVIEW = "PREVIEW", "Preview"
        CHECKOUT = "CHECKOUT", "Checkout"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="onboarding_progress"
    )
    step = models.CharField(max_length=20, choices=Step.choices, default=Step.QUESTIONNAIRE)
    selected_pathway_ids = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user} @ {self.step}"
