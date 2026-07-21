from django.conf import settings
from django.db import models

from common.models import BaseModel


class FileFolder(BaseModel):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="subfolders", null=True, blank=True
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="folders"
    )

    def __str__(self):
        return self.name


class UploadedFile(BaseModel):
    file = models.FileField(upload_to="uploads/%Y/%m/")
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveBigIntegerField(default=0)
    folder = models.ForeignKey(
        FileFolder, on_delete=models.SET_NULL, related_name="files", null=True, blank=True
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="uploaded_files"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.original_name
