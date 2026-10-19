from django.urls import path

from .views import (
    AdminSessionDetailView,
    AdminSessionListCreateView,
    AdminSessionRSVPListView,
    PastSessionsView,
    SessionDetailView,
    SessionJoinView,
    SessionRSVPView,
    SessionStatsView,
    SpeakerDetailView,
    SpeakerListCreateView,
    UpcomingSessionsView,
)

urlpatterns = [
    # Student
    path("upcoming/", UpcomingSessionsView.as_view(), name="live-sessions-upcoming"),
    path("past/", PastSessionsView.as_view(), name="live-sessions-past"),
    path("stats/", SessionStatsView.as_view(), name="live-sessions-stats"),
    path("speakers/", SpeakerListCreateView.as_view(), name="live-sessions-speakers"),
    path("speakers/<int:pk>/", SpeakerDetailView.as_view(), name="live-sessions-speaker-detail"),
    path("<int:pk>/", SessionDetailView.as_view(), name="live-sessions-detail"),
    path("<int:pk>/rsvp/", SessionRSVPView.as_view(), name="live-sessions-rsvp"),
    path("<int:pk>/join/", SessionJoinView.as_view(), name="live-sessions-join"),
    # Admin
    path("admin/sessions/", AdminSessionListCreateView.as_view(), name="live-sessions-admin-list"),
    path("admin/sessions/<int:pk>/", AdminSessionDetailView.as_view(), name="live-sessions-admin-detail"),
    path(
        "admin/sessions/<int:pk>/attendees/",
        AdminSessionRSVPListView.as_view(),
        name="live-sessions-admin-attendees",
    ),
]
