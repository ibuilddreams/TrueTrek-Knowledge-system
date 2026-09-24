from django.db import models

from common.models import BaseModel


class TestimonialStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PUBLISHED = "PUBLISHED", "Published"
    HIDDEN = "HIDDEN", "Hidden"


class Testimonial(BaseModel):
    """A public testimonial submitted from the Future Clients page.

    Submissions start PENDING and only appear on the public page once an
    admin publishes them, mirroring the moderation pattern used by
    future_clients.FutureClientApplication.
    """

    name = models.CharField(max_length=150)
    role = models.CharField(max_length=200, blank=True, default="")
    school = models.CharField(max_length=200, blank=True, default="")
    sport = models.CharField(max_length=200, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    quote = models.TextField()
    rating = models.PositiveSmallIntegerField()
    verified_badge = models.CharField(max_length=100, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=TestimonialStatus.choices, default=TestimonialStatus.PENDING
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=1, rating__lte=5),
                name="testimonial_rating_1_to_5",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.status})"
