from django.urls import path

from .views import (
    AdminTeacherRequestDetailView,
    AdminTeacherRequestListView,
    TeacherRequestDetailView,
    TeacherRequestListCreateView,
)

urlpatterns = [
    path("", TeacherRequestListCreateView.as_view(), name="teacher-request-list-create"),
    path("<int:pk>/", TeacherRequestDetailView.as_view(), name="teacher-request-detail"),
    path("admin/", AdminTeacherRequestListView.as_view(), name="teacher-request-admin-list"),
    path(
        "admin/<int:pk>/",
        AdminTeacherRequestDetailView.as_view(),
        name="teacher-request-admin-detail",
    ),
]
