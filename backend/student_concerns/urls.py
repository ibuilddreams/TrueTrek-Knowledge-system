from django.urls import path

from .views import (
    AdminStudentConcernDetailView,
    AdminStudentConcernListView,
    StudentConcernDetailView,
    StudentConcernListCreateView,
)

urlpatterns = [
    path("", StudentConcernListCreateView.as_view(), name="student-concern-list-create"),
    path("<int:pk>/", StudentConcernDetailView.as_view(), name="student-concern-detail"),
    path("admin/", AdminStudentConcernListView.as_view(), name="student-concern-admin-list"),
    path(
        "admin/<int:pk>/",
        AdminStudentConcernDetailView.as_view(),
        name="student-concern-admin-detail",
    ),
]
