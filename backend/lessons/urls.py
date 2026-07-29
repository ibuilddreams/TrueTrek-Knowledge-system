from django.urls import path

from .views import LessonDetailView, LessonListCreateView, LessonOrderView

urlpatterns = [
    path("", LessonListCreateView.as_view(), name="lesson-list-create"),
    path("<int:pk>/", LessonDetailView.as_view(), name="lesson-detail"),
    path("order/<int:module_id>/", LessonOrderView.as_view(), name="lesson-order"),
]
