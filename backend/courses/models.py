from django.conf import settings
from django.db import models
from django.utils.text import slugify

from common.models import BaseModel, Status


class Category(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Course(BaseModel):
    class Difficulty(models.TextChoices):
        BEGINNER = "BEGINNER", "Beginner"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        ADVANCED = "ADVANCED", "Advanced"

    title = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to="course_thumbnails/", null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="courses")
    tags = models.ManyToManyField(Tag, related_name="courses", blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    difficulty = models.CharField(
        max_length=20, choices=Difficulty.choices, default=Difficulty.BEGINNER
    )
    duration_minutes = models.PositiveIntegerField(default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} — {self.title}"

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class CourseInstructor(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="instructors")
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="taught_courses"
    )
    is_lead = models.BooleanField(default=False)

    class Meta:
        unique_together = ("course", "instructor")
        ordering = ["-is_lead", "id"]

    def __str__(self):
        return f"{self.instructor} -> {self.course}"
