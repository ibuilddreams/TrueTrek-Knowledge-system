from django.urls import path

from .views import (
    ProfileView,
    StudentBulkImportSampleView,
    StudentBulkImportView,
    StudentDetailView,
    StudentListCreateView,
    TeacherAssignedCoursesListView,
    TeacherAssignedCoursesStudentsView,
    TeacherBulkImportSampleView,
    TeacherBulkImportView,
    TeacherCourseStudentsDetailView,
    TeacherDetailView,
    TeacherEnrolledStudentDetailView,
    TeacherListCreateView,
)
from courses.views import (AdminTeacherAssignedCoursesView, AdminTeacherAssignedCoursesWithStudentsView)
from enrollments.views import (AdminStudentEnrollmentListView)

urlpatterns = [
    # Students
    path("student/admin/", StudentListCreateView.as_view(), name="student-list-create"),
    path("student/admin/bulk-import/", StudentBulkImportView.as_view(), name="student-bulk-import"),
    path(
        "student/admin/bulk-import/sample/",
        StudentBulkImportSampleView.as_view(),
        name="student-bulk-import-sample",
    ),
    path("student/<int:pk>/admin/", StudentDetailView.as_view(), name="student-detail"),
    path('student/<int:student_id>/courses/admin/', AdminStudentEnrollmentListView.as_view(), name='enrollment-student-admin-list',),

    # Teachers
    path("teacher/admin/", TeacherListCreateView.as_view(), name="teacher-list-create"),
    path("teacher/admin/bulk-import/", TeacherBulkImportView.as_view(), name="teacher-bulk-import"),
    path(
        "teacher/admin/bulk-import/sample/",
        TeacherBulkImportSampleView.as_view(),
        name="teacher-bulk-import-sample",
    ),
    path("teacher/<int:pk>/admin/", TeacherDetailView.as_view(), name="teacher-detail"),
    path('teacher/<int:teacher_id>/assignedcourses', AdminTeacherAssignedCoursesView.as_view(), name='teacher-assigned-courses-admin-list',),
    path('teacher/<int:teacher_id>/assignedcourses/studentsenrolled', AdminTeacherAssignedCoursesWithStudentsView.as_view(), name='teacher-assigned-courses-students-admin-list',),

    # Teachers (self-service)
    path('teacher/me/assignedcourses', TeacherAssignedCoursesListView.as_view(), name='teacher-assigned-courses-list'),
    path('teacher/me/assignedcourses/studentsenrolled/', TeacherAssignedCoursesStudentsView.as_view(), name='teacher-assigned-courses-students-list'),
    path('teacher/me/assignedcourses/<int:course_id>/studentdetail', TeacherCourseStudentsDetailView.as_view(), name='teacher-course-students-detail'),
    path('teacher/me/students/<int:student_id>/', TeacherEnrolledStudentDetailView.as_view(), name='teacher-enrolled-student-detail'),

    # Users
    path("user/profile/", ProfileView.as_view(), name="user-profile"),
]
