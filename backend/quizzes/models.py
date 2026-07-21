from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course


class Quiz(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="quizzes")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    passing_score = models.PositiveIntegerField(default=40)
    time_limit_minutes = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title


class Question(BaseModel):
    class QuestionType(models.TextChoices):
        MCQ = "MCQ", "Multiple Choice"
        TRUE_FALSE = "TRUE_FALSE", "True/False"
        SHORT_ANSWER = "SHORT_ANSWER", "Short Answer"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QuestionType.choices, default=QuestionType.MCQ)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["quiz", "order"]

    def __str__(self):
        return self.text[:50]


class Choice(BaseModel):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text


class QuizAttempt(BaseModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    attempt_number = models.PositiveIntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.student} - {self.quiz} #{self.attempt_number}"


class QuizAnswer(BaseModel):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    selected_choice = models.ForeignKey(
        Choice, on_delete=models.SET_NULL, related_name="answers", null=True, blank=True
    )
    text_answer = models.TextField(blank=True)

    def __str__(self):
        return f"{self.attempt} - {self.question}"


class QuizResult(BaseModel):
    attempt = models.OneToOneField(QuizAttempt, on_delete=models.CASCADE, related_name="result")
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_passed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.attempt} result"
