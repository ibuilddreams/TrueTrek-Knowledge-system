from django.db.models import Count, Q
from rest_framework import filters, generics
from rest_framework.permissions import IsAuthenticated

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from courses.services import is_course_instructor
from enrollments.models import Enrollment
from modules.models import Module
from users.permissions import IsStudent

from .models import Choice, Question, Quiz, QuizAnswer, QuizAttempt, QuizResult
from .permissions import IsCourseInstructorOrAdmin
from .serializers import (
    ChoiceSerializer,
    ChoiceWriteSerializer,
    QuestionSerializer,
    QuestionWriteSerializer,
    QuizAnswerGradeSerializer,
    QuizAvailableSerializer,
    QuizOrderEntrySerializer,
    QuizPendingAnswerSerializer,
    QuizResultSerializer,
    QuizSerializer,
    QuizSubmitSerializer,
    QuizWriteSerializer,
    StudentQuestionSerializer,
)
from .services import (
    InvalidAnswerError,
    QuizAttemptError,
    QuizGradingError,
    QuizPublishError,
    QuizReorderError,
    get_pending_grading_answers,
    get_student_grades,
    get_student_quizzes,
    grade_quiz_answer,
    publish_quiz,
    reorder_quizzes,
    start_quiz_attempt,
    submit_quiz_attempt,
)


class StudentQuizListView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request):
        data = get_student_quizzes(request.user)
        return success_response(data, message="Student quizzes fetched successfully")


class StudentGradesView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request):
        data = get_student_grades(request.user)
        return success_response(data, message="Student grades fetched successfully")


def _scope_quiz_queryset_for_reads(queryset, user):
    if user.is_admin:
        return queryset
    if user.is_teacher:
        return queryset.filter(
            Q(course__status=Status.PUBLISHED) | Q(course__instructors__instructor=user)
        ).distinct()
    return queryset.filter(course__status=Status.PUBLISHED)


class QuizListCreateView(generics.ListCreateAPIView):
    queryset = Quiz.objects.select_related("course", "module")
    pagination_class = Pagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "created_at", "order", "passing_score"]
    ordering = ["module", "order"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsCourseInstructorOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        module_id = self.request.query_params.get("module")
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        if self.request.method == "GET":
            queryset = _scope_quiz_queryset_for_reads(queryset, self.request.user)

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
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Quiz.objects.select_related("course", "module")

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsCourseInstructorOrAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.method == "GET":
            queryset = _scope_quiz_queryset_for_reads(queryset, self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return QuizWriteSerializer
        return QuizSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            quiz = self.get_queryset().get(pk=kwargs["pk"])
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(quiz)
        return success_response(serializer.data, message="Quiz fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            quiz = self.get_queryset().get(pk=kwargs["pk"])
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, quiz)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(quiz, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        return success_response(QuizSerializer(quiz).data, message="Quiz updated successfully")

    def destroy(self, request, *args, **kwargs):
        try:
            quiz = self.get_queryset().get(pk=kwargs["pk"])
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, quiz)

        quiz.delete()
        return success_response(None, message="Quiz deleted successfully")


class QuizPublishView(generics.GenericAPIView):
    queryset = Quiz.objects.select_related("course")
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            quiz = self.get_queryset().get(pk=pk)
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        if not (request.user.is_admin or is_course_instructor(request.user, quiz.course)):
            return error_response(
                message="You do not have permission to perform this action.", status_code=403
            )

        try:
            quiz = publish_quiz(quiz)
        except QuizPublishError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(QuizSerializer(quiz).data, message="Quiz published successfully")


class QuestionListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        return [IsCourseInstructorOrAdmin()]

    def get_queryset(self):
        queryset = Question.objects.filter(quiz_id=self.kwargs["quiz_id"]).prefetch_related("choices")
        user = self.request.user
        if self.request.method == "GET" and user.is_teacher and not user.is_admin:
            queryset = queryset.filter(quiz__course__instructors__instructor=user)
        return queryset

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
        return [IsCourseInstructorOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return QuestionWriteSerializer
        return QuestionSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            question = self.get_queryset().get(pk=kwargs["pk"])
        except Question.DoesNotExist:
            return error_response(message="Question with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, question)

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
        return [IsCourseInstructorOrAdmin()]

    def get_queryset(self):
        queryset = Choice.objects.filter(question_id=self.kwargs["question_id"])
        user = self.request.user
        if self.request.method == "GET" and user.is_teacher and not user.is_admin:
            queryset = queryset.filter(question__quiz__course__instructors__instructor=user)
        return queryset

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
        return [IsCourseInstructorOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ChoiceWriteSerializer
        return ChoiceSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            choice = self.get_queryset().get(pk=kwargs["pk"])
        except Choice.DoesNotExist:
            return error_response(message="Choice with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, choice)

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

        quizzes = Quiz.objects.filter(course_id=course_id, status=Status.PUBLISHED).annotate(
            question_count=Count("questions")
        )
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

        try:
            attempt = start_quiz_attempt(request.user, quiz)
        except QuizAttemptError as exc:
            return error_response(message=str(exc), status_code=403)

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


class QuizPendingGradingView(generics.ListAPIView):
    serializer_class = QuizPendingAnswerSerializer
    pagination_class = Pagination
    permission_classes = [IsCourseInstructorOrAdmin]

    def get_queryset(self):
        return get_pending_grading_answers(self.quiz)

    def list(self, request, *args, **kwargs):
        try:
            self.quiz = Quiz.objects.select_related("course").get(pk=kwargs["quiz_id"])
        except Quiz.DoesNotExist:
            return error_response(message="Quiz with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, self.quiz)

        answers = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(answers)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Pending grading answers fetched successfully")


class QuizAnswerGradeView(generics.GenericAPIView):
    serializer_class = QuizAnswerGradeSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            answer = QuizAnswer.objects.select_related(
                "attempt", "attempt__quiz__course", "question"
            ).get(pk=pk)
        except QuizAnswer.DoesNotExist:
            return error_response(message="Answer with the given id does not exist.", status_code=404)

        if not (
            request.user.is_admin or is_course_instructor(request.user, answer.attempt.quiz.course)
        ):
            return error_response(
                message="You do not have permission to perform this action.", status_code=403
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = grade_quiz_answer(
                answer,
                serializer.validated_data["marks_awarded"],
                serializer.validated_data.get("feedback", ""),
            )
        except QuizGradingError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(QuizResultSerializer(result).data, message="Answer graded successfully")


class QuizOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = QuizOrderEntrySerializer

    def get_permissions(self):
        return [IsCourseInstructorOrAdmin()]

    def patch(self, request, *args, **kwargs):
        module_id = kwargs["module_id"]
        try:
            module = Module.objects.select_related("course").get(pk=module_id)
        except Module.DoesNotExist:
            return error_response(message="Module with the given id does not exist.", status_code=404)

        if not (request.user.is_admin or is_course_instructor(request.user, module.course)):
            return error_response(
                message="You do not have permission to perform this action.",
                status_code=403,
            )

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            quizzes = reorder_quizzes(module_id, serializer.validated_data)
        except QuizReorderError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            QuizSerializer(quizzes, many=True).data,
            message="Quizzes reordered successfully",
        )
