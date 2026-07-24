from django.urls import path

from .views import (
    ProfileView,
    StudentDetailView,
    StudentListCreateView,
    TeacherDetailView,
    TeacherListCreateView,
)
from courses.views import (AdminTeacherAssignedCoursesView, AdminTeacherAssignedCoursesWithStudentsView)
from enrollments.views import (AdminStudentEnrollmentListView)

urlpatterns = [
    # Students
    path("student/admin/", StudentListCreateView.as_view(), name="student-list-create"),
    path("student/<int:pk>/admin/", StudentDetailView.as_view(), name="student-detail"),
    path('student/<int:student_id>/courses/admin/', AdminStudentEnrollmentListView.as_view(), name='enrollment-student-admin-list',),

    # Teachers
    path("teacher/admin/", TeacherListCreateView.as_view(), name="teacher-list-create"),
    path("teacher/<int:pk>/admin/", TeacherDetailView.as_view(), name="teacher-detail"),
    path('teacher/<int:teacher_id>/assignedcourses', AdminTeacherAssignedCoursesView.as_view(), name='teacher-assigned-courses-admin-list',),
    path('teacher/<int:teacher_id>/assignedcourses/studentsenrolled', AdminTeacherAssignedCoursesWithStudentsView.as_view(), name='teacher-assigned-courses-students-admin-list',),

    # Users
    path("user/profile/", ProfileView.as_view(), name="user-profile"),
]
