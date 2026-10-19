from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.pagination import Pagination
from common.response import error_response, success_response

from .models import MediaKitReview
from .serializers import (
    MediaKitReviewListSerializer,
    MediaKitReviewSerializer,
    MediaKitUploadSerializer,
)
from .services import MediaKitReviewError, start_review
from .throttling import MediaKitReviewThrottle


class MediaKitReviewListCreateView(generics.ListCreateAPIView):
    """POST uploads a media kit and starts a background review; GET lists
    this student's past reviews. Owner-scoped throughout — a review is only
    ever visible to the student who uploaded it."""

    permission_classes = [IsAuthenticated]
    pagination_class = Pagination
    parser_classes = [MultiPartParser, FormParser]

    # ScopedRateThrottle reads the scope off the *view* (`throttle_scope`),
    # not off the throttle class — same wiring as AdvisorChatView.
    throttle_scope = "media-kit-review"

    def get_throttles(self):
        return [MediaKitReviewThrottle()] if self.request.method == "POST" else []

    def get_queryset(self):
        return MediaKitReview.objects.filter(student=self.request.user)

    def get_serializer_class(self):
        return MediaKitUploadSerializer if self.request.method == "POST" else MediaKitReviewListSerializer

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = MediaKitReviewListSerializer(page, many=True)
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Media kit reviews fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = MediaKitUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        uploaded = serializer.validated_data["file"]
        try:
            review = start_review(
                student=request.user,
                file=uploaded,
                original_name=uploaded.name,
                mime_type=serializer.context["mime_type"],
                athlete_context=serializer.validated_data.get("athlete_context", ""),
            )
        except MediaKitReviewError as exc:
            return error_response(message=str(exc), status_code=409)

        return success_response(
            MediaKitReviewSerializer(review, context={"request": request}).data,
            message="Media kit uploaded — your review is being generated",
            status_code=201,
        )


class MediaKitReviewDetailView(APIView):
    """Polled by the frontend every couple of seconds while the review runs,
    the same way AiCourseModal polls an AICourseGeneration."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        review = MediaKitReview.objects.filter(pk=pk, student=request.user).first()
        if review is None:
            return error_response(message="Media kit review does not exist.", status_code=404)

        return success_response(
            MediaKitReviewSerializer(review, context={"request": request}).data,
            message="Media kit review fetched successfully",
        )

    def delete(self, request, pk, *args, **kwargs):
        review = MediaKitReview.objects.filter(pk=pk, student=request.user).first()
        if review is None:
            return error_response(message="Media kit review does not exist.", status_code=404)

        review.file.delete(save=False)
        review.delete()
        return success_response({}, message="Media kit review deleted successfully")


class LatestMediaKitReviewView(APIView):
    """The student's most recent review, so the tab can restore the last
    result (or resume polling an in-flight one) on mount without the
    frontend having to list-then-fetch."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        review = MediaKitReview.objects.filter(student=request.user).first()
        if review is None:
            return success_response(None, message="No media kit reviews yet")

        return success_response(
            MediaKitReviewSerializer(review, context={"request": request}).data,
            message="Latest media kit review fetched successfully",
        )
