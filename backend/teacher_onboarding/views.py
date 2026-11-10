from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin, IsTeacher

from .models import TeacherCredential, TeacherOnboarding
from .serializers import (
    AdminTeacherOnboardingListSerializer,
    TeacherCredentialCreateSerializer,
    TeacherOnboardingReviewSerializer,
    TeacherOnboardingSerializer,
    TeacherOnboardingUpdateSerializer,
)
from .services import (
    MAX_CREDENTIALS,
    access_state,
    delete_credential,
    get_onboarding,
    missing_requirements,
    review_onboarding,
    submit_onboarding,
)

NOT_EDITABLE_MESSAGE = (
    "Your application is with the review team and can't be edited right now."
)
# A teacher an admin created holds no application and needs none, so every
# teacher-facing endpoint here answers them with this rather than quietly
# creating one — holding a row is what `services.can_teach` gates on.
NO_APPLICATION_MESSAGE = "There is no teacher application for this account."


def _no_application():
    return error_response(message=NO_APPLICATION_MESSAGE, status_code=404)


class TeacherOnboardingAccessView(generics.GenericAPIView):
    """What the portal gates on: does this account need an approved
    application, and does it have one?

    Deliberately `IsAuthenticated` rather than `IsTeacher` — every portal asks
    this on load, and a student or admin getting a clean "nothing required"
    is a better answer than a 403 they then have to interpret.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = TeacherOnboardingSerializer  # for schema generation only

    def get(self, request):
        return success_response(
            access_state(request.user), message="Onboarding status fetched successfully"
        )


class MyTeacherOnboardingView(generics.GenericAPIView):
    """The teacher's own application, saved a step at a time.

    404s for a teacher who has none — see NO_APPLICATION_MESSAGE above."""

    permission_classes = [IsTeacher]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TeacherOnboardingUpdateSerializer
        return TeacherOnboardingSerializer

    def get_object(self):
        return get_onboarding(self.request.user)

    def get(self, request):
        onboarding = self.get_object()
        if onboarding is None:
            return _no_application()
        return success_response(
            TeacherOnboardingSerializer(onboarding, context=self.get_serializer_context()).data,
            message="Application fetched successfully",
        )

    def patch(self, request):
        onboarding = self.get_object()
        if onboarding is None:
            return _no_application()
        if not onboarding.is_editable:
            return error_response(message=NOT_EDITABLE_MESSAGE, status_code=400)

        serializer = self.get_serializer(onboarding, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return success_response(
            TeacherOnboardingSerializer(updated, context=self.get_serializer_context()).data,
            message="Application saved successfully",
        )


class TeacherOnboardingSubmitView(generics.GenericAPIView):
    """Hands a complete application to the admins."""

    permission_classes = [IsTeacher]
    serializer_class = TeacherOnboardingSerializer

    def post(self, request):
        onboarding = get_onboarding(request.user)
        if onboarding is None:
            return _no_application()
        if not onboarding.is_editable:
            return error_response(
                message="This application has already been submitted.", status_code=400
            )

        missing = missing_requirements(onboarding)
        if missing:
            # The same list the review step shows as a checklist, so a submit
            # the server refuses is one the screen already flagged.
            return error_response(
                message="Your application isn't complete yet. " + " ".join(missing),
                status_code=400,
            )

        submitted = submit_onboarding(onboarding)
        return success_response(
            TeacherOnboardingSerializer(submitted, context=self.get_serializer_context()).data,
            message="Application submitted for review",
        )


class MyTeacherCredentialListCreateView(generics.GenericAPIView):
    """Qualification documents on the current teacher's own application."""

    permission_classes = [IsTeacher]
    serializer_class = TeacherCredentialCreateSerializer

    def post(self, request):
        onboarding = get_onboarding(request.user)
        if onboarding is None:
            return _no_application()
        if not onboarding.is_editable:
            return error_response(message=NOT_EDITABLE_MESSAGE, status_code=400)
        if onboarding.credentials.count() >= MAX_CREDENTIALS:
            return error_response(
                message=f"You can attach up to {MAX_CREDENTIALS} documents.", status_code=400
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.save(onboarding=onboarding)
        return success_response(
            serializer.to_representation(credential),
            message="Document uploaded successfully",
            status_code=201,
        )


class MyTeacherCredentialDetailView(generics.GenericAPIView):
    """Removing a document from the current teacher's own application.
    Another teacher's document is a 404, never a 403 — the same rule the
    custom-pathway endpoints follow."""

    permission_classes = [IsTeacher]
    serializer_class = TeacherCredentialCreateSerializer

    def get_queryset(self):
        return TeacherCredential.objects.filter(onboarding__user=self.request.user)

    def delete(self, request, pk):
        credential = self.get_queryset().filter(pk=pk).first()
        if credential is None:
            return error_response(message="Document not found.", status_code=404)
        if not credential.onboarding.is_editable:
            return error_response(message=NOT_EDITABLE_MESSAGE, status_code=400)

        delete_credential(credential)
        return success_response(None, message="Document removed successfully")


class AdminTeacherOnboardingListView(generics.ListAPIView):
    """The review queue."""

    permission_classes = [IsAdmin]
    pagination_class = Pagination
    serializer_class = AdminTeacherOnboardingListSerializer

    def get_queryset(self):
        queryset = (
            TeacherOnboarding.objects.select_related("user", "reviewed_by")
            .annotate(credentials_count=Count("credentials"))
        )

        params = self.request.query_params

        status_filter = params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(user__name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__username__icontains=search)
                | Q(headline__icontains=search)
            )

        # Waiting applications first, then the most recently submitted — the
        # queue's own axis, not the model's Meta ordering, exactly as
        # `quests.AdminQuestSubmissionsView` re-orders for its feed.
        return queryset.order_by("-submitted_at", "-updated_at")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Applications fetched successfully")


class AdminTeacherOnboardingSummaryView(generics.GenericAPIView):
    """Counts per status for the queue header — one query rather than the
    table trying to total a paginated list it can only see one page of."""

    permission_classes = [IsAdmin]
    serializer_class = AdminTeacherOnboardingListSerializer  # schema only

    def get(self, request):
        counts = {
            row["status"]: row["total"]
            for row in TeacherOnboarding.objects.values("status").annotate(total=Count("id"))
        }
        data = {
            status.value: counts.get(status.value, 0)
            for status in TeacherOnboarding.ApplicationStatus
        }
        data["AWAITING_REVIEW"] = sum(
            counts.get(status.value, 0) for status in TeacherOnboarding.QUEUED_STATUSES
        )
        data["TOTAL"] = sum(counts.values())
        return success_response(data, message="Summary fetched successfully")


class AdminTeacherOnboardingDetailView(generics.GenericAPIView):
    """One application in full, and the decision on it."""

    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TeacherOnboardingReviewSerializer
        return TeacherOnboardingSerializer

    def get_queryset(self):
        return TeacherOnboarding.objects.select_related("user", "reviewed_by").prefetch_related(
            "credentials"
        )

    def get_object(self, pk):
        return self.get_queryset().filter(pk=pk).first()

    def get(self, request, pk):
        onboarding = self.get_object(pk)
        if onboarding is None:
            return error_response(message="Application not found.", status_code=404)
        return success_response(
            TeacherOnboardingSerializer(onboarding, context=self.get_serializer_context()).data,
            message="Application fetched successfully",
        )

    def patch(self, request, pk):
        onboarding = self.get_object(pk)
        if onboarding is None:
            return error_response(message="Application not found.", status_code=404)

        serializer = self.get_serializer(onboarding, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        reviewed = review_onboarding(
            onboarding,
            admin=request.user,
            status=serializer.validated_data["status"],
            notes=serializer.validated_data.get("review_notes", ""),
        )
        return success_response(
            TeacherOnboardingSerializer(reviewed, context=self.get_serializer_context()).data,
            message="Application updated successfully",
        )
