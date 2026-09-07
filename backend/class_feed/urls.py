from django.urls import path

from .views import FeedPostDetailView, FeedPostListCreateView

urlpatterns = [
    path("courses/<int:course_id>/posts/", FeedPostListCreateView.as_view(), name="class-feed-list-create"),
    path(
        "courses/<int:course_id>/posts/<int:post_id>/",
        FeedPostDetailView.as_view(),
        name="class-feed-detail",
    ),
]
