from django.urls import path

from .views import ProfileView, StudentDetailView, StudentListCreateView

urlpatterns = [
    path("students/admin/", StudentListCreateView.as_view(), name="student-list-create"),
    path("students/<int:pk>/admin/", StudentDetailView.as_view(), name="student-detail"),
    path("profile/", ProfileView.as_view(), name="user-profile"),
]
