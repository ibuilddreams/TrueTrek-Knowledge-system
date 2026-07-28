from django.urls import path

from .views import (
    LessonAttachmentDetailView,
    LessonAttachmentListCreateView,
    LessonDetailView,
    LessonListCreateView,
    LessonResourceDetailView,
    LessonResourceListCreateView,
)

urlpatterns = [
    path("", LessonListCreateView.as_view(), name="lesson-list-create"),
    path("<int:pk>/", LessonDetailView.as_view(), name="lesson-detail"),
    path("resources/", LessonResourceListCreateView.as_view(), name="lesson-resource-list-create"),
    path("resources/<int:pk>/", LessonResourceDetailView.as_view(), name="lesson-resource-detail"),
    path("attachments/", LessonAttachmentListCreateView.as_view(), name="lesson-attachment-list-create"),
    path("attachments/<int:pk>/", LessonAttachmentDetailView.as_view(), name="lesson-attachment-detail"),
]
