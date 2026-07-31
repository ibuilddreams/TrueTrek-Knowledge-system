from django.urls import path

from .views import (
    AssignmentAttachmentDetailView,
    AssignmentAttachmentListCreateView,
    AssignmentDetailView,
    AssignmentGradeSubmissionView,
    AssignmentListCreateView,
    AssignmentMySubmissionView,
    AssignmentOrderView,
    AssignmentPublishView,
    AssignmentSubmissionListView,
    AssignmentSubmitView,
    StudentAssignmentListView,
)

urlpatterns = [
    path("student/", StudentAssignmentListView.as_view(), name="assignment-student-list"),
    path("", AssignmentListCreateView.as_view(), name="assignment-list-create"),
    path("<int:pk>/", AssignmentDetailView.as_view(), name="assignment-detail"),
    path("<int:pk>/publish/", AssignmentPublishView.as_view(), name="assignment-publish"),
    path(
        "<int:assignment_id>/attachments/",
        AssignmentAttachmentListCreateView.as_view(),
        name="assignment-attachment-list-create",
    ),
    path(
        "attachments/<int:pk>/",
        AssignmentAttachmentDetailView.as_view(),
        name="assignment-attachment-detail",
    ),
    path(
        "<int:assignment_id>/submissions/",
        AssignmentSubmissionListView.as_view(),
        name="assignment-submission-list",
    ),
    path("<int:assignment_id>/submit/", AssignmentSubmitView.as_view(), name="assignment-submit"),
    path(
        "<int:assignment_id>/my-submission/",
        AssignmentMySubmissionView.as_view(),
        name="assignment-my-submission",
    ),
    path(
        "submissions/<int:pk>/grade/",
        AssignmentGradeSubmissionView.as_view(),
        name="assignment-submission-grade",
    ),
    path("order/<int:module_id>/", AssignmentOrderView.as_view(), name="assignment-order"),
]
