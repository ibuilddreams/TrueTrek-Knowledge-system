from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListCreateView,
    CourseDetailView,
    CourseListCreateView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<slug:slug>/", CategoryDetailView.as_view(), name="category-detail"),
    path("", CourseListCreateView.as_view(), name="course-list-create"),
    path("<slug:slug>/", CourseDetailView.as_view(), name="course-detail"),
]
