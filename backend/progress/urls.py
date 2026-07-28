from django.urls import path

from .views import CourseProgressDetailView, CourseProgressListView, ModuleProgressDetailView

urlpatterns = [
    path("", CourseProgressListView.as_view(), name="progress-list"),
    path("<int:course_id>/", CourseProgressDetailView.as_view(), name="progress-detail"),
    path("modules/<int:module_id>/", ModuleProgressDetailView.as_view(), name="module-progress-detail"),
]
