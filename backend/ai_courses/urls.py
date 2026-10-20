from django.urls import path

from .views import (
    GenerationCancelView,
    GenerationDetailView,
    GenerationLatestView,
    GenerationListCreateView,
    GenerationRetryView,
    GenerationUsageView,
)

urlpatterns = [
    path("usage/", GenerationUsageView.as_view(), name="ai-course-generation-usage"),
    path("generations/", GenerationListCreateView.as_view(), name="ai-course-generation-list-create"),
    # Before the <int:pk> route only for readability — "latest" could never match it.
    path("generations/latest/", GenerationLatestView.as_view(), name="ai-course-generation-latest"),
    path("generations/<int:pk>/", GenerationDetailView.as_view(), name="ai-course-generation-detail"),
    path("generations/<int:pk>/cancel/", GenerationCancelView.as_view(), name="ai-course-generation-cancel"),
    path("generations/<int:pk>/retry/", GenerationRetryView.as_view(), name="ai-course-generation-retry"),
]
