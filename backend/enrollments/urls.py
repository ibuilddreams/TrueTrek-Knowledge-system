from django.urls import path

from .views import (
    AdminCourseEnrollmentListView,
    AdminEnrollmentDetailView,
    AdminEnrollmentListView,
    EnrollmentBulkImportSampleView,
    EnrollmentBulkImportView,
    EnrollmentListCreateView,
    StudentEnrolledCourseDetailView,
    TeacherEnrollmentListView,
)

urlpatterns = [
    path(
        "student/<int:course_id>/",
        StudentEnrolledCourseDetailView.as_view(),
        name="enrollment-student-course-detail",
    ),
    path("student/", EnrollmentListCreateView.as_view(), name="enrollment-student-list-create"),
    path("admin/", AdminEnrollmentListView.as_view(), name="enrollment-admin-list"),
    path("admin/bulk-import/", EnrollmentBulkImportView.as_view(), name="enrollment-bulk-import"),
    path(
        "admin/bulk-import/sample/",
        EnrollmentBulkImportSampleView.as_view(),
        name="enrollment-bulk-import-sample",
    ),
    path("<int:pk>/admin/", AdminEnrollmentDetailView.as_view(), name="enrollment-admin-detail"),
    path("teacher/", TeacherEnrollmentListView.as_view(), name="enrollment-teacher-list"),
    path(
        "courses/<int:course_id>/admin/",
        AdminCourseEnrollmentListView.as_view(),
        name="enrollment-course-admin-list",
    ),
]
