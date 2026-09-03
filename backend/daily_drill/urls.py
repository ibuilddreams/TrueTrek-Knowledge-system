from django.urls import path

from .views import (
    AdminDrillQuizView,
    AdminDrillScheduleActivateView,
    AdminDrillScheduleDeactivateView,
    AdminDrillScheduleDetailView,
    AdminDrillScheduleListCreateView,
    AdminDrillSchedulePerformanceView,
    DailyDrillAttemptView,
    DailyDrillSubmitQuizView,
    DailyDrillTodayView,
    DailyDrillVideoProgressView,
)

urlpatterns = [
    # Student — today's Daily Drill (backend resolves the source)
    path("today/", DailyDrillTodayView.as_view(), name="daily-drill-today"),
    path("attempt/", DailyDrillAttemptView.as_view(), name="daily-drill-attempt"),
    path(
        "<int:schedule_id>/video-progress/",
        DailyDrillVideoProgressView.as_view(),
        name="daily-drill-video-progress",
    ),
    path("<int:schedule_id>/submit/", DailyDrillSubmitQuizView.as_view(), name="daily-drill-submit-quiz"),

    # Admin — Daily Drill schedule management
    path("admin/schedules/", AdminDrillScheduleListCreateView.as_view(), name="daily-drill-admin-schedules"),
    path(
        "admin/schedules/<int:pk>/",
        AdminDrillScheduleDetailView.as_view(),
        name="daily-drill-admin-schedule-detail",
    ),
    path("admin/schedules/<int:pk>/quiz/", AdminDrillQuizView.as_view(), name="daily-drill-admin-schedule-quiz"),
    path(
        "admin/schedules/<int:pk>/activate/",
        AdminDrillScheduleActivateView.as_view(),
        name="daily-drill-admin-schedule-activate",
    ),
    path(
        "admin/schedules/<int:pk>/deactivate/",
        AdminDrillScheduleDeactivateView.as_view(),
        name="daily-drill-admin-schedule-deactivate",
    ),
    path(
        "admin/schedules/<int:pk>/performance/",
        AdminDrillSchedulePerformanceView.as_view(),
        name="daily-drill-admin-schedule-performance",
    ),
]
