from django.urls import path

from .views import (
    ClassSessionDetailView,
    ClassSessionJoinView,
    ClassSessionLeaveView,
    ClassSessionNotesAudioView,
    ClassSessionNotesDocumentView,
    ClassSessionNotesView,
    ClassSessionRecordingView,
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
    # GET is the recording's state and, for a finished one, a freshly signed
    # playback link — the only thing that ever releases one. POST/DELETE are
    # the teacher starting and stopping it.
    path(
        "<int:pk>/recording/",
        ClassSessionRecordingView.as_view(),
        name="class-sessions-recording",
    ),
    # The class's AI meeting notes — a separate Agora product from the
    # recording above, on its own switch, so the two URLs stay separate too.
    # GET is the notes' state and, once they are written, the notes
    # themselves; POST/DELETE are the teacher starting and stopping them.
    path(
        "<int:pk>/notes/",
        ClassSessionNotesView.as_view(),
        name="class-sessions-notes",
    ),
    # Where the class's own audio arrives, one segment at a time, while the
    # class is still running — the local notes source's equivalent of Agora
    # writing caption slices into a bucket, except that the bucket is this
    # server's own media folder and the teacher's browser is the recorder.
    path(
        "<int:pk>/notes/audio/",
        ClassSessionNotesAudioView.as_view(),
        name="class-sessions-notes-audio",
    ),
    # The notes as a PDF. Behind the same roster check, streamed rather than
    # redirected to, so nothing forwardable is ever handed out.
    path(
        "<int:pk>/notes/document/",
        ClassSessionNotesDocumentView.as_view(),
        name="class-sessions-notes-document",
    ),
]
