from django.urls import path

from .views import (
    GenerationCancelView,
    GenerationDetailView,
    GenerationListCreateView,
    GenerationRetryView,
    GenerationUsageView,
)

urlpatterns = [
    path("usage/", GenerationUsageView.as_view(), name="ai-course-generation-usage"),
    path("generations/", GenerationListCreateView.as_view(), name="ai-course-generation-list-create"),
    path("generations/<int:pk>/", GenerationDetailView.as_view(), name="ai-course-generation-detail"),
    path("generations/<int:pk>/cancel/", GenerationCancelView.as_view(), name="ai-course-generation-cancel"),
    path("generations/<int:pk>/retry/", GenerationRetryView.as_view(), name="ai-course-generation-retry"),
]
