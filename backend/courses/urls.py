from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListCreateView,
    CourseDetailView,
    CourseListCreateView,
    CourseStatusChoicesView,
    TagListView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path("tags/", TagListView.as_view(), name="tag-list"),
    path("status-choices/", CourseStatusChoicesView.as_view(), name="course-status-choices"),
    path("", CourseListCreateView.as_view(), name="course-list-create"),
    path("<int:pk>/", CourseDetailView.as_view(), name="course-detail"),
]
