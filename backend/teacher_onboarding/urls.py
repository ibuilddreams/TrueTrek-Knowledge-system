from django.urls import path

from .views import (
    AdminTeacherOnboardingDetailView,
    AdminTeacherOnboardingListView,
    AdminTeacherOnboardingSummaryView,
    MyTeacherCredentialDetailView,
    MyTeacherCredentialListCreateView,
    MyTeacherOnboardingView,
    TeacherOnboardingAccessView,
    TeacherOnboardingSubmitView,
)

urlpatterns = [
    path("status/", TeacherOnboardingAccessView.as_view(), name="teacher-onboarding-status"),
    path("me/", MyTeacherOnboardingView.as_view(), name="teacher-onboarding-me"),
    path("me/submit/", TeacherOnboardingSubmitView.as_view(), name="teacher-onboarding-submit"),
    path(
        "me/credentials/",
        MyTeacherCredentialListCreateView.as_view(),
        name="teacher-onboarding-credentials",
    ),
    path(
        "me/credentials/<int:pk>/",
        MyTeacherCredentialDetailView.as_view(),
        name="teacher-onboarding-credential-detail",
    ),
    path("admin/", AdminTeacherOnboardingListView.as_view(), name="teacher-onboarding-admin-list"),
    path(
        "admin/summary/",
        AdminTeacherOnboardingSummaryView.as_view(),
        name="teacher-onboarding-admin-summary",
    ),
    path(
        "admin/<int:pk>/",
        AdminTeacherOnboardingDetailView.as_view(),
        name="teacher-onboarding-admin-detail",
    ),
]
