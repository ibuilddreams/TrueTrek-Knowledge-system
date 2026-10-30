from django.urls import path

from .views import (
    ClassSessionDetailView,
    ClassSessionJoinView,
    ClassSessionLeaveView,
    ClassSessionWhiteboardView,
    StudentPastClassesView,
    StudentUpcomingClassesView,
    TeacherClassSessionAttendanceView,
    TeacherClassSessionDetailView,
    TeacherClassSessionListCreateView,
)

urlpatterns = [
    # Student — classes on the courses they're enrolled in
    path("my/upcoming/", StudentUpcomingClassesView.as_view(), name="class-sessions-my-upcoming"),
    path("my/past/", StudentPastClassesView.as_view(), name="class-sessions-my-past"),
    # Teacher — scheduling
    path("teacher/", TeacherClassSessionListCreateView.as_view(), name="class-sessions-teacher-list"),
    path(
        "teacher/<int:pk>/",
        TeacherClassSessionDetailView.as_view(),
        name="class-sessions-teacher-detail",
    ),
    path(
        "teacher/<int:pk>/attendance/",
        TeacherClassSessionAttendanceView.as_view(),
        name="class-sessions-teacher-attendance",
    ),
    # Shared — both sides of the classroom door
    path("<int:pk>/", ClassSessionDetailView.as_view(), name="class-sessions-detail"),
    path("<int:pk>/join/", ClassSessionJoinView.as_view(), name="class-sessions-join"),
    path("<int:pk>/leave/", ClassSessionLeaveView.as_view(), name="class-sessions-leave"),
    # POST mints a room token (creating the board on first use), PATCH is
    # the teacher handing the pen to the class.
    path(
        "<int:pk>/whiteboard/",
        ClassSessionWhiteboardView.as_view(),
        name="class-sessions-whiteboard",
    ),
]
