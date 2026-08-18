from django.urls import path

from .views import (
    AdminApplicationApproveView,
    AdminApplicationDetailView,
    AdminApplicationListView,
    AdminApplicationRejectView,
    FutureClientApplicationCreateView,
)

urlpatterns = [
    path("apply/", FutureClientApplicationCreateView.as_view(), name="future-client-apply"),
    path("admin/", AdminApplicationListView.as_view(), name="future-client-admin-list"),
    path("admin/<int:pk>/", AdminApplicationDetailView.as_view(), name="future-client-admin-detail"),
    path(
        "admin/<int:pk>/approve/",
        AdminApplicationApproveView.as_view(),
        name="future-client-admin-approve",
    ),
    path(
        "admin/<int:pk>/reject/",
        AdminApplicationRejectView.as_view(),
        name="future-client-admin-reject",
    ),
]
