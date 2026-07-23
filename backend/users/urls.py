from django.urls import path

from .views import (
    ProfileView,
    StudentDetailView,
    StudentListCreateView,
    TeacherDetailView,
    TeacherListCreateView,
)

urlpatterns = [
    path("students/admin/", StudentListCreateView.as_view(), name="student-list-create"),
    path("students/<int:pk>/admin/", StudentDetailView.as_view(), name="student-detail"),
    path("teachers/admin/", TeacherListCreateView.as_view(), name="teacher-list-create"),
    path("teachers/<int:pk>/admin/", TeacherDetailView.as_view(), name="teacher-detail"),
    path("profile/", ProfileView.as_view(), name="user-profile"),
]
