from django.urls import path

from .views import (
    AbandonSessionView,
    AdminScenarioDetailView,
    AdminScenarioListCreateView,
    AdminSessionDetailView,
    AdminSessionListView,
    AdminStatsView,
    EvaluateSessionView,
    ModuleStatsView,
    ScenarioListView,
    SessionDetailView,
    SessionHistoryView,
    StartSessionView,
    SubmitTurnView,
)

urlpatterns = [
    # Student — the LS-302 role-play module
    path("scenarios/", ScenarioListView.as_view(), name="roleplay-scenarios"),
    path("stats/", ModuleStatsView.as_view(), name="roleplay-stats"),
    path("sessions/", SessionHistoryView.as_view(), name="roleplay-session-history"),
    path("sessions/start/", StartSessionView.as_view(), name="roleplay-session-start"),
    path("sessions/<int:pk>/", SessionDetailView.as_view(), name="roleplay-session-detail"),
    path("sessions/<int:pk>/reply/", SubmitTurnView.as_view(), name="roleplay-session-reply"),
    path("sessions/<int:pk>/evaluate/", EvaluateSessionView.as_view(), name="roleplay-session-evaluate"),
    path("sessions/<int:pk>/abandon/", AbandonSessionView.as_view(), name="roleplay-session-abandon"),

    # Admin — scenario catalog and the read-only activity feed
    path("admin/scenarios/", AdminScenarioListCreateView.as_view(), name="roleplay-admin-scenarios"),
    path(
        "admin/scenarios/<int:pk>/",
        AdminScenarioDetailView.as_view(),
        name="roleplay-admin-scenario-detail",
    ),
    path("admin/stats/", AdminStatsView.as_view(), name="roleplay-admin-stats"),
    path("admin/sessions/", AdminSessionListView.as_view(), name="roleplay-admin-sessions"),
    path(
        "admin/sessions/<int:pk>/",
        AdminSessionDetailView.as_view(),
        name="roleplay-admin-session-detail",
    ),
]
