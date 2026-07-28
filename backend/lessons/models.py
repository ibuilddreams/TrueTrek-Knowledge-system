from django.db import models

from common.models import BaseModel
from modules.models import Module


class Lesson(BaseModel):
    class ContentType(models.TextChoices):
        VIDEO = "VIDEO", "Video"
        PDF = "PDF", "PDF"
        DOCUMENT = "DOCUMENT", "Document"

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content_type = models.CharField(max_length=20, choices=ContentType.choices)
    video_url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to="lessons/", blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["module", "order"]

    def __str__(self):
        return self.title
