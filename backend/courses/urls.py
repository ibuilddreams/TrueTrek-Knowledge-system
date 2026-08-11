from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListCreateView,
    CourseDetailView,
    CourseListCreateView,
    CourseStatusChoicesView,
    PublicCourseListView,
    TagDetailView,
    TagListCreateView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path("tags/", TagListCreateView.as_view(), name="tag-list-create"),
    path("tags/<int:pk>/", TagDetailView.as_view(), name="tag-detail"),
    path("status-choices/", CourseStatusChoicesView.as_view(), name="course-status-choices"),
    path("public/", PublicCourseListView.as_view(), name="course-public-list"),
    path("", CourseListCreateView.as_view(), name="course-list-create"),
    path("<int:pk>/", CourseDetailView.as_view(), name="course-detail"),
]
