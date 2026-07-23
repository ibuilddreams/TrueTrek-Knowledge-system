from django.urls import path

from .views import CourseProgressDetailView, CourseProgressListView

urlpatterns = [
    path("", CourseProgressListView.as_view(), name="progress-list"),
    path("<int:course_id>/", CourseProgressDetailView.as_view(), name="progress-detail"),
]
