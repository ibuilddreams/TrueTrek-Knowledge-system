from django.urls import path

from .views import (
    CourseFeedbackListView,
    InstructorDetailView,
    InstructorFeedbackDetailView,
    InstructorFeedbackEligibilityView,
    InstructorFeedbackListCreateView,
    MyInstructorFeedbackView,
    MyInstructorProfileView,
)

urlpatterns = [
    path("me/profile/", MyInstructorProfileView.as_view(), name="instructor-my-profile"),
    path("me/feedback/", MyInstructorFeedbackView.as_view(), name="instructor-my-feedback"),
    path("course/<slug:slug>/feedback/", CourseFeedbackListView.as_view(), name="course-instructor-feedback"),
    path("<int:pk>/", InstructorDetailView.as_view(), name="instructor-detail"),
    path("<int:pk>/feedback/", InstructorFeedbackListCreateView.as_view(), name="instructor-feedback"),
    path(
        "<int:pk>/feedback/eligibility/",
        InstructorFeedbackEligibilityView.as_view(),
        name="instructor-feedback-eligibility",
    ),
    path(
        "<int:pk>/feedback/<int:course_id>/",
        InstructorFeedbackDetailView.as_view(),
        name="instructor-feedback-detail",
    ),
]
