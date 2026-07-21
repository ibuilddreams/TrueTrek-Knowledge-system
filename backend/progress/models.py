from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course
from lessons.models import Lesson
from modules.models import Module


class LessonProgress(BaseModel):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress")
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("student", "lesson")

    def __str__(self):
        return f"{self.student} - {self.lesson}"


class ModuleProgress(BaseModel):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="module_progress"
    )
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="progress")
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("student", "module")

    def __str__(self):
        return f"{self.student} - {self.module}"


class CourseProgress(BaseModel):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="course_progress"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="progress")
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("student", "course")

    def __str__(self):
        return f"{self.student} - {self.course}"


class LearningActivity(BaseModel):
    class ActivityType(models.TextChoices):
        LOGIN = "LOGIN", "Login"
        LESSON_VIEW = "LESSON_VIEW", "Lesson View"
        QUIZ_ATTEMPT = "QUIZ_ATTEMPT", "Quiz Attempt"
        COURSE_ENROLL = "COURSE_ENROLL", "Course Enroll"
        OTHER = "OTHER", "Other"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities"
    )
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, related_name="activities", null=True, blank=True
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.SET_NULL, related_name="activities", null=True, blank=True
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student} - {self.activity_type}"
