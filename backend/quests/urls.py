from django.urls import path

from .views import (
    AdminQuestDetailView,
    AdminQuestListCreateView,
    AdminQuestStatsView,
    AdminQuestSubmissionsView,
    CompleteQuestView,
    QuestHistoryView,
    QuestStatsView,
    SkipQuestView,
    TodaysQuestsView,
)

urlpatterns = [
    # Student
    path("today/", TodaysQuestsView.as_view(), name="quests-today"),
    path("stats/", QuestStatsView.as_view(), name="quests-stats"),
    path("history/", QuestHistoryView.as_view(), name="quests-history"),
    path(
        "assignments/<int:assignment_id>/complete/", CompleteQuestView.as_view(), name="quests-complete"
    ),
    path("assignments/<int:assignment_id>/skip/", SkipQuestView.as_view(), name="quests-skip"),
    # Admin — catalog management
    path("admin/stats/", AdminQuestStatsView.as_view(), name="quests-admin-stats"),
    path(
        "admin/submissions/", AdminQuestSubmissionsView.as_view(), name="quests-admin-submissions"
    ),
    path("", AdminQuestListCreateView.as_view(), name="quests-list-create"),
    path("<int:pk>/", AdminQuestDetailView.as_view(), name="quests-detail"),
]
