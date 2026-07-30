from django.db.models import Count
from rest_framework import generics

from common.pagination import Pagination
from common.response import error_response, success_response
from enrollments.models import Enrollment
from users.permissions import IsAdmin, IsStudent

from .models import Choice, Question, Quiz, QuizAttempt, QuizResult
from .permissions import IsCourseInstructorOrAdmin
from .serializers import (
    ChoiceSerializer,
    ChoiceWriteSerializer,
    QuestionSerializer,
    QuestionWriteSerializer,
    QuizAvailableSerializer,
    QuizResultSerializer,
    QuizSerializer,
    QuizSubmitSerializer,
    QuizWriteSerializer,
    StudentQuestionSerializer,
)
from .services import MAX_ATTEMPTS_PER_QUIZ, InvalidAnswerError, start_quiz_attempt, submit_quiz_attempt


def _admin_permission():
    permission = IsAdmin()
    permission.message = "You do not have permission to perform this action. Only admin can perform this action."
    return permission


class QuizListCreateView(generics.ListCreateAPIView):
    queryset = Quiz.objects.select_related("course", "module")
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsCourseInstructorOrAdmin()]
        return [_admin_permission()]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        module_id = self.request.query_params.get("module")
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return QuizWriteSerializer
        return QuizSerializer

    def list(self, request, *args, **kwargs):
        quizzes = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(quizzes)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Quizzes fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        return success_response(
            QuizSerializer(quiz).data, message="Quiz created successfully", status_code=201
        )


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "head", "options"]
    queryset = Quiz.objects.select_related("course", "module")
    serializer_class = QuizSerializer

    def get_permissions(self):
        return [_admin_permission()]

    def retrieve(self, request, *args, **kwargs):
        try:
            quiz = self.get_queryset().get(pk=kwargs["pk"])
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(quiz)
        return success_response(serializer.data, message="Quiz fetched successfully")


class QuestionListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsCourseInstructorOrAdmin()]
        return [_admin_permission()]

    def get_queryset(self):
        return Question.objects.filter(quiz_id=self.kwargs["quiz_id"]).prefetch_related("choices")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return QuestionWriteSerializer
        return QuestionSerializer

    def list(self, request, *args, **kwargs):
        if not Quiz.objects.filter(pk=kwargs["quiz_id"]).exists():
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        questions = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(questions, many=True)
        return success_response(serializer.data, message="Questions fetched successfully")

    def create(self, request, *args, **kwargs):
        try:
            quiz = Quiz.objects.get(pk=kwargs["quiz_id"])
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.save(quiz=quiz)
        return success_response(
            QuestionSerializer(question).data,
            message="Question created successfully",
            status_code=201,
        )


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Question.objects.select_related("quiz__course").prefetch_related("choices")

    def get_permissions(self):
        if self.request.method in ("PATCH", "DELETE"):
            return [IsCourseInstructorOrAdmin()]
        return [_admin_permission()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return QuestionWriteSerializer
        return QuestionSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            question = self.get_queryset().get(pk=kwargs["pk"])
        except Question.DoesNotExist:
            return error_response(message="Question with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(question)
        return success_response(serializer.data, message="Question fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            question = self.get_queryset().get(pk=kwargs["pk"])
        except Question.DoesNotExist:
            return error_response(message="Question with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, question)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(question, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return success_response(QuestionSerializer(question).data, message="Question updated successfully")

    def destroy(self, request, *args, **kwargs):
        try:
            question = self.get_queryset().get(pk=kwargs["pk"])
        except Question.DoesNotExist:
            return error_response(message="Question with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, question)

        question.delete()
        return success_response(None, message="Question deleted successfully")


class ChoiceListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsCourseInstructorOrAdmin()]
        return [_admin_permission()]

    def get_queryset(self):
        return Choice.objects.filter(question_id=self.kwargs["question_id"])

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChoiceWriteSerializer
        return ChoiceSerializer

    def list(self, request, *args, **kwargs):
        if not Question.objects.filter(pk=kwargs["question_id"]).exists():
            return error_response(
                message="Question with the given id does not exist.", status_code=404
            )

        choices = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(choices, many=True)
        return success_response(serializer.data, message="Choices fetched successfully")

    def create(self, request, *args, **kwargs):
        try:
            question = Question.objects.get(pk=kwargs["question_id"])
        except Question.DoesNotExist:
            return error_response(
                message="Question with the given id does not exist.", status_code=404
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        choice = serializer.save(question=question)
        return success_response(
            ChoiceSerializer(choice).data, message="Choice created successfully", status_code=201
        )


class ChoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Choice.objects.select_related("question__quiz__course")

    def get_permissions(self):
        if self.request.method in ("PATCH", "DELETE"):
            return [IsCourseInstructorOrAdmin()]
        return [_admin_permission()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ChoiceWriteSerializer
        return ChoiceSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            choice = self.get_queryset().get(pk=kwargs["pk"])
        except Choice.DoesNotExist:
            return error_response(message="Choice with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(choice)
        return success_response(serializer.data, message="Choice fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            choice = self.get_queryset().get(pk=kwargs["pk"])
        except Choice.DoesNotExist:
            return error_response(message="Choice with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, choice)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(choice, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        choice = serializer.save()
        return success_response(ChoiceSerializer(choice).data, message="Choice updated successfully")

    def destroy(self, request, *args, **kwargs):
        try:
            choice = self.get_queryset().get(pk=kwargs["pk"])
        except Choice.DoesNotExist:
            return error_response(message="Choice with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, choice)

        choice.delete()
        return success_response(None, message="Choice deleted successfully")


class AvailableQuizzesView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request, course_id):
        if not Enrollment.objects.filter(
            student=request.user, course_id=course_id, status=Enrollment.EnrollmentStatus.ACTIVE
        ).exists():
            return error_response(message="You are not enrolled in this course.", status_code=403)

        quizzes = Quiz.objects.filter(course_id=course_id).annotate(question_count=Count("questions"))
        serializer = QuizAvailableSerializer(quizzes, many=True)
        return success_response(serializer.data, message="Available quizzes fetched successfully")


class StartQuizAttemptView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.select_related("course").get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        if not Enrollment.objects.filter(
            student=request.user, course_id=quiz.course_id, status=Enrollment.EnrollmentStatus.ACTIVE
        ).exists():
            return error_response(message="You are not enrolled in this course.", status_code=403)

        attempt = start_quiz_attempt(request.user, quiz)
        if attempt is None:
            return error_response(
                message=f"You have used all {MAX_ATTEMPTS_PER_QUIZ} allowed attempts for this quiz.",
                status_code=403,
            )

        questions = quiz.questions.prefetch_related("choices")
        data = {
            "attempt_id": attempt.id,
            "attempt_number": attempt.attempt_number,
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "time_limit_minutes": quiz.time_limit_minutes,
            },
            "questions": StudentQuestionSerializer(questions, many=True).data,
        }
        return success_response(data, message="Quiz attempt started", status_code=201)


class SubmitQuizAttemptView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = QuizSubmitSerializer

    def post(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.select_related("quiz").get(
                pk=attempt_id, student=request.user
            )
        except QuizAttempt.DoesNotExist:
            return error_response(
                message="Quiz attempt with the given id does not exist.", status_code=404
            )

        if attempt.ended_at is not None:
            return error_response(
                message="This quiz attempt has already been submitted.", status_code=400
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = submit_quiz_attempt(attempt, serializer.validated_data["answers"])
        except InvalidAnswerError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            QuizResultSerializer(result).data, message="Quiz submitted successfully"
        )


class QuizAttemptResultView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request, attempt_id):
        try:
            result = QuizResult.objects.select_related("attempt", "attempt__quiz").get(
                attempt_id=attempt_id, attempt__student=request.user
            )
        except QuizResult.DoesNotExist:
            return error_response(
                message="Result not found for this attempt.", status_code=404
            )

        return success_response(
            QuizResultSerializer(result).data, message="Quiz result fetched successfully"
        )
