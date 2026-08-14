from django.urls import path

from .views import (
    AdminQuestionDetailView,
    AdminQuestionListCreateView,
    OnboardingProgressView,
    PathwayRecommendationView,
    QuestionnaireQuestionsView,
    QuestionnaireSubmitView,
)

urlpatterns = [
    path("admin/questions/", AdminQuestionListCreateView.as_view(), name="onboarding-admin-question-list-create"),
    path("admin/questions/<int:pk>/", AdminQuestionDetailView.as_view(), name="onboarding-admin-question-detail"),
    path("questions/", QuestionnaireQuestionsView.as_view(), name="onboarding-question-list"),
    path("answers/", QuestionnaireSubmitView.as_view(), name="onboarding-answers-submit"),
    path("recommendations/", PathwayRecommendationView.as_view(), name="onboarding-recommendations"),
    path("progress/", OnboardingProgressView.as_view(), name="onboarding-progress"),
]
