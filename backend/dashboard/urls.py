from django.urls import path

from .views import (
    AdminDashboardActivityProgressView,
    AdminDashboardChartsView,
    AdminDashboardStatisticsView,
    TeacherDashboardView
)

urlpatterns = [
    path(
        "admin/statistics/",
        AdminDashboardStatisticsView.as_view(),
        name="dashboard-admin-statistics",
    ),
    path(
        "admin/activity-progress/",
        AdminDashboardActivityProgressView.as_view(),
        name="dashboard-admin-activity-progress",
    ),
    path(
        "admin/charts/",
        AdminDashboardChartsView.as_view(),
        name="dashboard-admin-charts",
    ),
    path(
        'api/teacher/dashboard/stats',
        TeacherDashboardView.as_view(),
        name='teacher-dashboard-stats',
    ),
]
