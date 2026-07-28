from django.urls import path

from .views import LessonDetailView, LessonListCreateView

urlpatterns = [
    path("", LessonListCreateView.as_view(), name="lesson-list-create"),
    path("<int:pk>/", LessonDetailView.as_view(), name="lesson-detail"),
]
