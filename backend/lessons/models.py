from django.db import models

from common.models import BaseModel
from modules.models import Module


class Lesson(BaseModel):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["module", "order"]

    def __str__(self):
        return self.title


class LessonResource(BaseModel):
    class ResourceType(models.TextChoices):
        LINK = "LINK", "Link"
        DOCUMENT = "DOCUMENT", "Document"
        VIDEO = "VIDEO", "Video"
        OTHER = "OTHER", "Other"

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=20, choices=ResourceType.choices, default=ResourceType.LINK)
    url = models.URLField()

    def __str__(self):
        return self.title


class LessonAttachment(BaseModel):
    class FileType(models.TextChoices):
        PDF = "PDF", "PDF"
        IMAGE = "IMAGE", "Image"
        DOCUMENT = "DOCUMENT", "Document"
        OTHER = "OTHER", "Other"

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="lesson_attachments/")
    file_type = models.CharField(max_length=20, choices=FileType.choices, default=FileType.OTHER)

    def __str__(self):
        return f"{self.lesson.title} attachment"


class VideoLesson(BaseModel):
    class Provider(models.TextChoices):
        YOUTUBE = "YOUTUBE", "YouTube"
        VIMEO = "VIMEO", "Vimeo"
        SELF_HOSTED = "SELF_HOSTED", "Self Hosted"
        OTHER = "OTHER", "Other"

    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name="video")
    video_url = models.URLField()
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.SELF_HOSTED)
    duration_seconds = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Video for {self.lesson.title}"
