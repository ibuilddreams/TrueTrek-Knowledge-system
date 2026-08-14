from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin, IsStudent

from .models import Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment
from .serializers import (
    PathwayBundleRuleSerializer,
    PathwayBundleRuleWriteSerializer,
    PathwayCheckoutRequestSerializer,
    PathwayCourseAttachSerializer,
    PathwayCourseOrderEntrySerializer,
    PathwayCourseSerializer,
    PathwayDetailSerializer,
    PathwayEnrollmentSerializer,
    PathwayListSerializer,
    PathwayWriteSerializer,
    PublicPathwayDetailSerializer,
)
from .services import PathwayReorderError, checkout_pathways, reorder_pathway_courses


class PublicPathwayListView(generics.ListAPIView):
    """Anonymous-safe pathway browsing — published pathways only, no auth required."""

    queryset = Pathway.objects.filter(status=Status.PUBLISHED)
    serializer_class = PathwayListSerializer
    permission_classes = [AllowAny]
    pagination_class = Pagination

    def list(self, request, *args, **kwargs):
        pathways = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(pathways)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Pathways fetched successfully")


class PublicPathwayDetailView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            pathway = Pathway.objects.get(pk=pk, status=Status.PUBLISHED)
        except Pathway.DoesNotExist:
            return error_response(message="Pathway with the given id does not exist.", status_code=404)

        serializer = PublicPathwayDetailSerializer(pathway, context={"request": request})
        return success_response(serializer.data, message="Pathway fetched successfully")


class PathwayListCreateView(generics.ListCreateAPIView):
    queryset = Pathway.objects.all()
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PathwayWriteSerializer
        return PathwayListSerializer

    def list(self, request, *args, **kwargs):
        pathways = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(pathways)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Pathways fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pathway = serializer.save()
        return success_response(
            PathwayDetailSerializer(pathway, context={"request": request}).data,
            message="Pathway created successfully",
            status_code=201,
        )


class PathwayDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Pathway.objects.all()

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return PathwayWriteSerializer
        return PathwayDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            pathway = self.get_queryset().get(pk=kwargs["pk"])
        except Pathway.DoesNotExist:
            return error_response(message="Pathway with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(pathway, context={"request": request})
        return success_response(serializer.data, message="Pathway fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            pathway = self.get_queryset().get(pk=kwargs["pk"])
        except Pathway.DoesNotExist:
            return error_response(message="Pathway with the given id does not exist.", status_code=404)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(pathway, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        pathway = serializer.save()
        return success_response(
            PathwayDetailSerializer(pathway, context={"request": request}).data,
            message="Pathway updated successfully",
        )

    def destroy(self, request, *args, **kwargs):
        try:
            pathway = self.get_queryset().get(pk=kwargs["pk"])
        except Pathway.DoesNotExist:
            return error_response(message="Pathway with the given id does not exist.", status_code=404)

        pathway.delete()
        return success_response(None, message="Pathway deleted successfully")


class PathwayCourseAttachView(generics.GenericAPIView):
    http_method_names = ["post", "head", "options"]
    serializer_class = PathwayCourseAttachSerializer
    permission_classes = [IsAdmin]

    def post(self, request, pathway_id):
        try:
            pathway = Pathway.objects.get(pk=pathway_id)
        except Pathway.DoesNotExist:
            return error_response(message="Pathway with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data, context={"pathway": pathway})
        serializer.is_valid(raise_exception=True)
        pathway_course = serializer.save()

        return success_response(
            PathwayCourseSerializer(pathway_course, context={"request": request}).data,
            message="Course attached to pathway successfully",
            status_code=201,
        )


class PathwayCourseDetachView(generics.GenericAPIView):
    http_method_names = ["delete", "head", "options"]
    permission_classes = [IsAdmin]

    def delete(self, request, pathway_id, course_id):
        deleted_count, _ = PathwayCourse.objects.filter(
            pathway_id=pathway_id, course_id=course_id
        ).delete()
        if not deleted_count:
            return error_response(message="This course is not attached to the pathway.", status_code=404)
        return success_response(None, message="Course detached from pathway successfully")


class PathwayCourseOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = PathwayCourseOrderEntrySerializer
    permission_classes = [IsAdmin]

    def patch(self, request, pathway_id):
        if not Pathway.objects.filter(pk=pathway_id).exists():
            return error_response(message="Pathway with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            pathway_courses = reorder_pathway_courses(pathway_id, serializer.validated_data)
        except PathwayReorderError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            PathwayCourseSerializer(pathway_courses, many=True, context={"request": request}).data,
            message="Pathway courses reordered successfully",
        )


class PathwayBundleRuleListCreateView(generics.ListCreateAPIView):
    queryset = PathwayBundleRule.objects.all()
    pagination_class = None

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PathwayBundleRuleWriteSerializer
        return PathwayBundleRuleSerializer

    def list(self, request, *args, **kwargs):
        rules = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(rules, many=True)
        return success_response(serializer.data, message="Bundle rules fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rule = serializer.save()
        return success_response(
            PathwayBundleRuleSerializer(rule).data,
            message="Bundle rule created successfully",
            status_code=201,
        )


class PathwayBundleRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["patch", "delete", "head", "options"]
    queryset = PathwayBundleRule.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        return PathwayBundleRuleWriteSerializer

    def update(self, request, *args, **kwargs):
        try:
            rule = self.get_queryset().get(pk=kwargs["pk"])
        except PathwayBundleRule.DoesNotExist:
            return error_response(message="Bundle rule with the given id does not exist.", status_code=404)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(rule, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        rule = serializer.save()
        return success_response(
            PathwayBundleRuleSerializer(rule).data, message="Bundle rule updated successfully"
        )

    def destroy(self, request, *args, **kwargs):
        try:
            rule = self.get_queryset().get(pk=kwargs["pk"])
        except PathwayBundleRule.DoesNotExist:
            return error_response(message="Bundle rule with the given id does not exist.", status_code=404)

        rule.delete()
        return success_response(None, message="Bundle rule deleted successfully")


class PathwayCheckoutView(generics.GenericAPIView):
    """Dummy-payment checkout: no real payment gateway yet — the frontend simulates
    payment success, then calls this to grant pathway entitlements + enroll the
    student in every published course inside the purchased pathway(s)."""

    serializer_class = PathwayCheckoutRequestSerializer
    permission_classes = [IsStudent]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = checkout_pathways(request.user, serializer.validated_data["pathway_ids"])
        enrolled_count = len(result["enrolled_pathways"])
        already_count = len(result["already_enrolled_pathways"])
        failed_count = len(result["failed_pathways"])

        if not enrolled_count and not already_count:
            message = "Checkout failed — none of the selected pathways could be processed."
        elif failed_count:
            message = (
                f"{enrolled_count} pathway(s) unlocked successfully, "
                f"{failed_count} couldn't be processed."
            )
        else:
            message = "Payment successful — your pathway access is ready."

        return success_response(result, message=message)


class MyPathwaysView(generics.ListAPIView):
    serializer_class = PathwayEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return PathwayEnrollment.objects.filter(
            user=self.request.user, status=PathwayEnrollment.EnrollmentStatus.ACTIVE
        ).select_related("pathway")

    def list(self, request, *args, **kwargs):
        enrollments = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(enrollments, many=True, context={"request": request})
        return success_response(serializer.data, message="My pathways fetched successfully")
