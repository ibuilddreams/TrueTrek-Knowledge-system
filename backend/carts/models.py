from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course


class CartItem(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart_items"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="cart_items")

    class Meta:
        unique_together = ("user", "course")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} -> {self.course}"
