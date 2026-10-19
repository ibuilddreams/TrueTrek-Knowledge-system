from django.urls import path

from .views import (
    LatestMediaKitReviewView,
    MediaKitReviewDetailView,
    MediaKitReviewListCreateView,
)

urlpatterns = [
    path("reviews/", MediaKitReviewListCreateView.as_view(), name="media-kit-review-list-create"),
    path("reviews/latest/", LatestMediaKitReviewView.as_view(), name="media-kit-review-latest"),
    path("reviews/<int:pk>/", MediaKitReviewDetailView.as_view(), name="media-kit-review-detail"),
]
