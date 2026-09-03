from django.urls import path

from .views import (
    AdminAdjustPointsView,
    AdminPointsTransactionsListView,
    AdminRedemptionListView,
    AdminRedemptionProcessView,
    AdminRedemptionScheduleView,
    AdminStudentPointsDetailView,
    AdminStudentPointsListView,
    MyPointsSummaryView,
    MyPointsTransactionsView,
    MyRedemptionsView,
    RewardActivateView,
    RewardCatalogView,
    RewardDeactivateView,
    RewardDetailView,
    RewardListCreateView,
    RewardRedeemView,
)

urlpatterns = [
    # Rewards catalog — admin management
    path("", RewardListCreateView.as_view(), name="rewards-list-create"),
    path("<int:pk>/", RewardDetailView.as_view(), name="rewards-detail"),
    path("<int:pk>/activate/", RewardActivateView.as_view(), name="rewards-activate"),
    path("<int:pk>/deactivate/", RewardDeactivateView.as_view(), name="rewards-deactivate"),

    # Rewards catalog — student browsing & redemption
    path("catalog/", RewardCatalogView.as_view(), name="rewards-catalog"),
    path("<int:pk>/redeem/", RewardRedeemView.as_view(), name="rewards-redeem"),
    path("my/redemptions/", MyRedemptionsView.as_view(), name="rewards-my-redemptions"),

    # Redemption management — admin
    path("admin/redemptions/", AdminRedemptionListView.as_view(), name="rewards-admin-redemptions"),
    path(
        "admin/redemptions/<int:pk>/",
        AdminRedemptionProcessView.as_view(),
        name="rewards-admin-redemption-process",
    ),
    path(
        "admin/redemptions/<int:pk>/schedule/",
        AdminRedemptionScheduleView.as_view(),
        name="rewards-admin-redemption-schedule",
    ),

    # Points — student self-service
    path("points/my/", MyPointsSummaryView.as_view(), name="points-my-summary"),
    path("points/my/transactions/", MyPointsTransactionsView.as_view(), name="points-my-transactions"),

    # Points — admin visibility & manual adjustment
    path(
        "points/admin/students/", AdminStudentPointsListView.as_view(), name="points-admin-students"
    ),
    path(
        "points/admin/students/<int:student_id>/",
        AdminStudentPointsDetailView.as_view(),
        name="points-admin-student-detail",
    ),
    path(
        "points/admin/transactions/",
        AdminPointsTransactionsListView.as_view(),
        name="points-admin-transactions",
    ),
    path("points/admin/adjust/", AdminAdjustPointsView.as_view(), name="points-admin-adjust"),
]
