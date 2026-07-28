from django.urls import path

from .views import (
    AvailableQuizzesView,
    ChoiceDetailView,
    ChoiceListCreateView,
    QuestionDetailView,
    QuestionListCreateView,
    QuizAttemptResultView,
    QuizDetailView,
    QuizListCreateView,
    StartQuizAttemptView,
    SubmitQuizAttemptView,
)

urlpatterns = [
    path("", QuizListCreateView.as_view(), name="quiz-list-create"),
    path("course/<int:course_id>/", AvailableQuizzesView.as_view(), name="quiz-available-list"),
    path("<int:pk>/", QuizDetailView.as_view(), name="quiz-detail"),
    path("<int:quiz_id>/questions/", QuestionListCreateView.as_view(), name="quiz-question-list-create"),
    path("<int:quiz_id>/attempts/", StartQuizAttemptView.as_view(), name="quiz-attempt-start"),
    path("questions/<int:pk>/", QuestionDetailView.as_view(), name="question-detail"),
    path(
        "questions/<int:question_id>/choices/",
        ChoiceListCreateView.as_view(),
        name="question-choice-list-create",
    ),
    path("choices/<int:pk>/", ChoiceDetailView.as_view(), name="choice-detail"),
    path("attempts/<int:attempt_id>/submit/", SubmitQuizAttemptView.as_view(), name="quiz-attempt-submit"),
    path("attempts/<int:attempt_id>/result/", QuizAttemptResultView.as_view(), name="quiz-attempt-result"),
]
