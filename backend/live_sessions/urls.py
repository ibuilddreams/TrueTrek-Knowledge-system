from django.urls import path

from .views import (
    AdminSessionDetailView,
    AdminSessionListCreateView,
    AdminSessionRSVPListView,
    PastSessionsView,
    SessionDetailView,
    SessionJoinView,
    SessionLeaveView,
    SessionNotesAudioView,
    SessionNotesDocumentView,
    SessionNotesView,
    SessionRoomView,
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
    # The external platforms' door: releases the meeting link, and only once
    # the room is open.
    path("<int:pk>/join/", SessionJoinView.as_view(), name="live-sessions-join"),
    # This platform's own door. POST mints an Agora token for one person;
    # PATCH is a host opening the floor to the room, or taking it back.
    # Separate from `/join/` above because the two hand out different things:
    # one releases somebody else's URL, the other mints a credential.
    path("<int:pk>/room/", SessionRoomView.as_view(), name="live-sessions-room"),
    path("<int:pk>/leave/", SessionLeaveView.as_view(), name="live-sessions-leave"),
    # The session's AI meeting notes. GET is their state and, once they are
    # written, the notes themselves; POST/DELETE are a host starting and
    # pausing them.
    path("<int:pk>/notes/", SessionNotesView.as_view(), name="live-sessions-notes"),
    # Where the room's own audio arrives, one segment at a time, while the
    # session is still running.
    path(
        "<int:pk>/notes/audio/",
        SessionNotesAudioView.as_view(),
        name="live-sessions-notes-audio",
    ),
    # The notes as a PDF. Behind the same check, streamed rather than
    # redirected to, so nothing forwardable is ever handed out.
    path(
        "<int:pk>/notes/document/",
        SessionNotesDocumentView.as_view(),
        name="live-sessions-notes-document",
    ),
    # Admin
    path("admin/sessions/", AdminSessionListCreateView.as_view(), name="live-sessions-admin-list"),
    path("admin/sessions/<int:pk>/", AdminSessionDetailView.as_view(), name="live-sessions-admin-detail"),
    path(
        "admin/sessions/<int:pk>/attendees/",
        AdminSessionRSVPListView.as_view(),
        name="live-sessions-admin-attendees",
    ),
]
