from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.response import error_response, success_response
from pathways.serializers import PathwayListSerializer
from users.permissions import IsAdmin

from .models import OnboardingProgress, Question, QuestionnaireAnswer
from .serializers import (
    OnboardingProgressSerializer,
    QuestionAdminSerializer,
    QuestionnaireSubmitSerializer,
    QuestionPublicSerializer,
    QuestionWriteSerializer,
)
from .services import compute_pathway_recommendations, submit_answers


class AdminQuestionListCreateView(generics.ListCreateAPIView):
    queryset = Question.objects.prefetch_related("options__pathway_weights__pathway")
    permission_classes = [IsAdmin]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == "POST":
            return QuestionWriteSerializer
        return QuestionAdminSerializer

    def list(self, request, *args, **kwargs):
        questions = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(questions, many=True)
        return success_response(serializer.data, message="Questions fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return success_response(
            QuestionAdminSerializer(question).data,
            message="Question created successfully",
            status_code=201,
        )


class AdminQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Question.objects.prefetch_related("options__pathway_weights__pathway")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return QuestionWriteSerializer
        return QuestionAdminSerializer

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

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(question, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return success_response(
            QuestionAdminSerializer(question).data, message="Question updated successfully"
        )

    def destroy(self, request, *args, **kwargs):
        try:
            question = self.get_queryset().get(pk=kwargs["pk"])
        except Question.DoesNotExist:
            return error_response(message="Question with the given id does not exist.", status_code=404)

        question.delete()
        return success_response(None, message="Question deleted successfully")


class QuestionnaireQuestionsView(generics.ListAPIView):
    queryset = Question.objects.filter(is_active=True).prefetch_related("options")
    serializer_class = QuestionPublicSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        questions = self.filter_queryset(self.get_queryset())
        answered_map = dict(
            QuestionnaireAnswer.objects.filter(user=request.user).values_list("question_id", "option_id")
        )
        serializer = self.get_serializer(
            questions, many=True, context={"request": request, "answered_map": answered_map}
        )
        return success_response(serializer.data, message="Questionnaire fetched successfully")


class QuestionnaireSubmitView(generics.GenericAPIView):
    serializer_class = QuestionnaireSubmitSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submit_answers(request.user, serializer.validated_data["answers"])
        return success_response(None, message="Answers submitted successfully")


class PathwayRecommendationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pathways = compute_pathway_recommendations(request.user)
        data = [
            {**PathwayListSerializer(pathway, context={"request": request}).data, "score": pathway.score}
            for pathway in pathways
        ]
        return success_response(data, message="Pathway recommendations fetched successfully")


class OnboardingProgressView(generics.GenericAPIView):
    """Lets the onboarding wizard resume exactly where a user left off —
    across a refresh, a closed browser, or logging in again on another
    device — instead of restarting at step one every time."""

    http_method_names = ["get", "put", "delete", "head", "options"]
    serializer_class = OnboardingProgressSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress = OnboardingProgress.objects.filter(user=request.user).first()
        if progress is None:
            return success_response(None, message="No saved onboarding progress")
        return success_response(
            self.get_serializer(progress).data, message="Onboarding progress fetched successfully"
        )

    def put(self, request):
        progress, _ = OnboardingProgress.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(progress, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, message="Onboarding progress saved successfully")

    def delete(self, request):
        OnboardingProgress.objects.filter(user=request.user).delete()
        return success_response(None, message="Onboarding progress cleared successfully")
