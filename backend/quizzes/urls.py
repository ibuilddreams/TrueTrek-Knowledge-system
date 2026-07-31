from django.urls import path

from .views import (
    AvailableQuizzesView,
    ChoiceDetailView,
    ChoiceListCreateView,
    QuestionDetailView,
    QuestionListCreateView,
    QuestionOrderView,
    QuizAnswerGradeView,
    QuizAttemptResultView,
    QuizDetailView,
    QuizListCreateView,
    QuizOrderView,
    QuizPendingGradingView,
    QuizPublishView,
    StartQuizAttemptView,
    StudentGradesView,
    StudentQuizListView,
    SubmitQuizAttemptView,
)

urlpatterns = [
    path("student/grades/", StudentGradesView.as_view(), name="quiz-student-grades"),
    path("student/", StudentQuizListView.as_view(), name="quiz-student-list"),
    path("", QuizListCreateView.as_view(), name="quiz-list-create"),
    path("course/<int:course_id>/", AvailableQuizzesView.as_view(), name="quiz-available-list"),
    path("<int:pk>/", QuizDetailView.as_view(), name="quiz-detail"),
    path("<int:pk>/publish/", QuizPublishView.as_view(), name="quiz-publish"),
    path("<int:quiz_id>/questions/", QuestionListCreateView.as_view(), name="quiz-question-list-create"),
    path("<int:quiz_id>/questions/order/", QuestionOrderView.as_view(), name="question-order"),
    path("<int:quiz_id>/attempts/", StartQuizAttemptView.as_view(), name="quiz-attempt-start"),
    path(
        "<int:quiz_id>/pending-grading/",
        QuizPendingGradingView.as_view(),
        name="quiz-pending-grading",
    ),
    path("questions/<int:pk>/", QuestionDetailView.as_view(), name="question-detail"),
    path(
        "questions/<int:question_id>/choices/",
        ChoiceListCreateView.as_view(),
        name="question-choice-list-create",
    ),
    path("choices/<int:pk>/", ChoiceDetailView.as_view(), name="choice-detail"),
    path("attempts/<int:attempt_id>/submit/", SubmitQuizAttemptView.as_view(), name="quiz-attempt-submit"),
    path("attempts/<int:attempt_id>/result/", QuizAttemptResultView.as_view(), name="quiz-attempt-result"),
    path("answers/<int:pk>/grade/", QuizAnswerGradeView.as_view(), name="quiz-answer-grade"),
    path("order/<int:module_id>/", QuizOrderView.as_view(), name="quiz-order"),
]
