from django.urls import path

from .views import (
    AdminCourseEnrollmentListView,
    AdminEnrollmentDetailView,
    AdminEnrollmentListView,
    EnrollmentListCreateView,
    TeacherEnrollmentListView,
)

urlpatterns = [
    path("student/", EnrollmentListCreateView.as_view(), name="enrollment-student-list-create"),
    path("admin/", AdminEnrollmentListView.as_view(), name="enrollment-admin-list"),
    path("<int:pk>/admin/", AdminEnrollmentDetailView.as_view(), name="enrollment-admin-detail"),
    path("teacher/", TeacherEnrollmentListView.as_view(), name="enrollment-teacher-list"),
    path(
        "courses/<int:course_id>/admin/",
        AdminCourseEnrollmentListView.as_view(),
        name="enrollment-course-admin-list",
    ),
]
