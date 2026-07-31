from django.urls import path

from .views import (
    LessonCompleteView,
    LessonDetailView,
    LessonListCreateView,
    LessonOrderView,
)

urlpatterns = [
    path("", LessonListCreateView.as_view(), name="lesson-list-create"),
    path("<int:pk>/", LessonDetailView.as_view(), name="lesson-detail"),
    path("order/<int:module_id>/", LessonOrderView.as_view(), name="lesson-order"),
    path("<int:pk>/complete/", LessonCompleteView.as_view(), name="lesson-complete"),
]
