from django.urls import path

from .views import ProfileView, StudentListCreateView

urlpatterns = [
    path("students/", StudentListCreateView.as_view(), name="student-list-create"),
    path("profile/", ProfileView.as_view(), name="user-profile"),
]
