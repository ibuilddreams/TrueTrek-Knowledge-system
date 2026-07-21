from django.db import models

from common.models import BaseModel
from courses.models import Course


class Module(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["course", "order"]

    def __str__(self):
        return self.title
