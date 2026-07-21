from django.conf import settings
from django.db import models

from common.models import BaseModel


class SearchHistory(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="search_history"
    )
    query = models.CharField(max_length=255)
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-searched_at"]

    def __str__(self):
        return self.query


class SavedSearch(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_searches"
    )
    name = models.CharField(max_length=255)
    keywords = models.CharField(max_length=255, blank=True)
    filters = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name
