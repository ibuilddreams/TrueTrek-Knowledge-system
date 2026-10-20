from rest_framework import generics

from common.pagination import Pagination
from common.response import error_response, success_response

from .models import AICourseGeneration
from .permissions import CanUseAICourseGeneration
from .serializers import GenerationDetailSerializer, GenerationListSerializer, GenerationRequestSerializer
from .services import (
    GenerationConcurrencyError,
    GenerationQuotaError,
    cancel_generation,
    get_monthly_usage,
    get_resumable_generation,
    reap_stale_jobs,
    retry_generation,
    start_generation,
)
from .throttling import AIGenerationThrottle

GenerationStatus = AICourseGeneration.GenerationStatus


class GenerationListCreateView(generics.ListCreateAPIView):
    queryset = AICourseGeneration.objects.select_related("course", "requested_by")
    permission_classes = [CanUseAICourseGeneration]
    pagination_class = Pagination
    # ScopedRateThrottle reads the scope off the *view*, not the throttle class —
    # this must be set here even though AIGenerationThrottle also names its scope.
    throttle_scope = "ai-generation"

    def get_throttles(self):
        if self.request.method == "POST":
            return [AIGenerationThrottle()]
        return []

    def get_serializer_class(self):
        if self.request.method == "POST":
            return GenerationRequestSerializer
        return GenerationListSerializer

    def list(self, request, *args, **kwargs):
        jobs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(jobs)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="AI course generations fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            job = start_generation(request.user, serializer.validated_data)
        except GenerationConcurrencyError as exc:
            return error_response(message=str(exc), status_code=409)
        except GenerationQuotaError as exc:
            return error_response(message=str(exc), status_code=429)

        return success_response(
            {"job_id": job.id},
            message="Course generation started",
            status_code=202,
        )


class GenerationDetailView(generics.RetrieveAPIView):
    queryset = AICourseGeneration.objects.select_related("course", "course__category")
    serializer_class = GenerationDetailSerializer
    permission_classes = [CanUseAICourseGeneration]

    def retrieve(self, request, *args, **kwargs):
        # Polled every 2s by every open wizard — the reaper runs here too so a job
        # orphaned by a mid-generation deploy restart doesn't poll RUNNING forever.
        reap_stale_jobs()
        try:
            job = self.get_queryset().get(pk=kwargs["pk"])
        except AICourseGeneration.DoesNotExist:
            return error_response(message="Generation with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(job)
        return success_response(serializer.data, message="Generation status fetched successfully")


class GenerationLatestView(generics.GenericAPIView):
    """The generation this admin should be offered on Admin -> Courses, or null.

    Backs the resume banner there, which is what makes closing the wizard safe:
    the job id the wizard held is gone the moment the admin switches tab or
    reloads, but the generation is still running and this finds it again. Scoped
    to the requesting admin — another admin's generation is not theirs to resume
    or dismiss."""

    permission_classes = [CanUseAICourseGeneration]
    serializer_class = GenerationDetailSerializer

    def get(self, request):
        # Same reason as the detail view: this is polled while a generation runs,
        # so a job orphaned by a mid-generation deploy restart gets noticed here
        # too rather than showing a progress bar that will never move.
        reap_stale_jobs()
        job = get_resumable_generation(request.user)
        return success_response(
            self.get_serializer(job).data if job else None,
            message="Latest AI course generation fetched successfully",
        )


class GenerationCancelView(generics.GenericAPIView):
    queryset = AICourseGeneration.objects.all()
    permission_classes = [CanUseAICourseGeneration]

    def post(self, request, pk):
        try:
            job = self.get_queryset().get(pk=pk)
        except AICourseGeneration.DoesNotExist:
            return error_response(message="Generation with the given id does not exist.", status_code=404)

        job = cancel_generation(job)
        return success_response(
            GenerationDetailSerializer(job).data, message="Generation cancelled"
        )


class GenerationRetryView(generics.GenericAPIView):
    queryset = AICourseGeneration.objects.all()
    permission_classes = [CanUseAICourseGeneration]

    def post(self, request, pk):
        try:
            original_job = self.get_queryset().get(pk=pk)
        except AICourseGeneration.DoesNotExist:
            return error_response(message="Generation with the given id does not exist.", status_code=404)

        try:
            job = retry_generation(request.user, original_job)
        except GenerationConcurrencyError as exc:
            return error_response(message=str(exc), status_code=409)
        except GenerationQuotaError as exc:
            return error_response(message=str(exc), status_code=429)

        return success_response(
            {"job_id": job.id}, message="Course generation restarted", status_code=202
        )


class GenerationUsageView(generics.GenericAPIView):
    permission_classes = [CanUseAICourseGeneration]

    def get(self, request):
        usage = get_monthly_usage(request.user)
        return success_response(usage, message="AI generation usage fetched successfully")
