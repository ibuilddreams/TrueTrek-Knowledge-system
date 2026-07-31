from django.urls import path

from .views import (
    CourseLessonProgressListView,
    CourseProgressDetailView,
    CourseProgressListView,
    ModuleProgressDetailView,
    StudentLessonProgressDetailView,
)

urlpatterns = [
    path("", CourseProgressListView.as_view(), name="progress-list"),
    path("<int:course_id>/", CourseProgressDetailView.as_view(), name="progress-detail"),
    path("modules/<int:module_id>/", ModuleProgressDetailView.as_view(), name="module-progress-detail"),
    path(
        "courses/<int:course_id>/lessons/",
        CourseLessonProgressListView.as_view(),
        name="course-lesson-progress-list",
    ),
    path(
        "courses/<int:course_id>/lessons/<int:student_id>/",
        StudentLessonProgressDetailView.as_view(),
        name="student-lesson-progress-detail",
    ),
]
