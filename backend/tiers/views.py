from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin

from .models import Tier, TierPathway
from .serializers import (
    TierDetailSerializer,
    TierListSerializer,
    TierOrderEntrySerializer,
    TierPathwayAttachSerializer,
    TierPathwayOrderEntrySerializer,
    TierPathwaySerializer,
    TierProgressSerializer,
    TierWriteSerializer,
)
from .services import (
    TierPathwayError,
    TierReorderError,
    attach_pathway_to_tier,
    get_or_create_tier_progress,
    reorder_tier_pathways,
    reorder_tiers,
)


class PublicTierListView(generics.ListAPIView):
    """Anonymous-safe tier roadmap browsing — published tiers only, no auth required."""

    queryset = Tier.objects.filter(status=Status.PUBLISHED)
    serializer_class = TierListSerializer
    permission_classes = [AllowAny]
    pagination_class = Pagination

    def list(self, request, *args, **kwargs):
        tiers = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(tiers)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Tiers fetched successfully")


class PublicTierDetailView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            tier = Tier.objects.get(pk=pk, status=Status.PUBLISHED)
        except Tier.DoesNotExist:
            return error_response(message="Tier with the given id does not exist.", status_code=404)

        serializer = TierDetailSerializer(tier, context={"request": request, "public_only": True})
        return success_response(serializer.data, message="Tier fetched successfully")


class TierListCreateView(generics.ListCreateAPIView):
    queryset = Tier.objects.all()
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TierWriteSerializer
        return TierListSerializer

    def list(self, request, *args, **kwargs):
        tiers = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(tiers)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Tiers fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tier = serializer.save()
        return success_response(
            TierDetailSerializer(tier, context={"request": request}).data,
            message="Tier created successfully",
            status_code=201,
        )


class TierDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Tier.objects.all()

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TierWriteSerializer
        return TierDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            tier = self.get_queryset().get(pk=kwargs["pk"])
        except Tier.DoesNotExist:
            return error_response(message="Tier with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(tier, context={"request": request})
        return success_response(serializer.data, message="Tier fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            tier = self.get_queryset().get(pk=kwargs["pk"])
        except Tier.DoesNotExist:
            return error_response(message="Tier with the given id does not exist.", status_code=404)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(tier, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        tier = serializer.save()
        return success_response(
            TierDetailSerializer(tier, context={"request": request}).data,
            message="Tier updated successfully",
        )

    def destroy(self, request, *args, **kwargs):
        try:
            tier = self.get_queryset().get(pk=kwargs["pk"])
        except Tier.DoesNotExist:
            return error_response(message="Tier with the given id does not exist.", status_code=404)

        tier.delete()
        return success_response(None, message="Tier deleted successfully")


class TierOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = TierOrderEntrySerializer
    permission_classes = [IsAdmin]

    def patch(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            tiers = reorder_tiers(serializer.validated_data)
        except TierReorderError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            TierListSerializer(tiers, many=True, context={"request": request}).data,
            message="Tiers reordered successfully",
        )


class TierPathwayAttachView(generics.GenericAPIView):
    http_method_names = ["post", "head", "options"]
    serializer_class = TierPathwayAttachSerializer
    permission_classes = [IsAdmin]

    def post(self, request, tier_id):
        try:
            tier = Tier.objects.get(pk=tier_id)
        except Tier.DoesNotExist:
            return error_response(message="Tier with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            tier_pathway = attach_pathway_to_tier(tier, serializer.validated_data["pathway"])
        except TierPathwayError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            TierPathwaySerializer(tier_pathway, context={"request": request}).data,
            message="Pathway attached to tier successfully",
            status_code=201,
        )


class TierPathwayDetachView(generics.GenericAPIView):
    http_method_names = ["delete", "head", "options"]
    permission_classes = [IsAdmin]

    def delete(self, request, tier_id, pathway_id):
        deleted_count, _ = TierPathway.objects.filter(
            tier_id=tier_id, pathway_id=pathway_id
        ).delete()
        if not deleted_count:
            return error_response(message="This pathway is not attached to the tier.", status_code=404)
        return success_response(None, message="Pathway detached from tier successfully")


class TierPathwayOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = TierPathwayOrderEntrySerializer
    permission_classes = [IsAdmin]

    def patch(self, request, tier_id):
        if not Tier.objects.filter(pk=tier_id).exists():
            return error_response(message="Tier with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            tier_pathways = reorder_tier_pathways(tier_id, serializer.validated_data)
        except TierPathwayError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            TierPathwaySerializer(tier_pathways, many=True, context={"request": request}).data,
            message="Pathways reordered successfully",
        )


class MyTierProgressView(generics.ListAPIView):
    serializer_class = TierProgressSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return get_or_create_tier_progress(self.request.user)

    def list(self, request, *args, **kwargs):
        progress_rows = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(progress_rows, many=True, context={"request": request})
        return success_response(serializer.data, message="My tier progress fetched successfully")


class TierProgressDetailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            tier = Tier.objects.get(pk=pk)
        except Tier.DoesNotExist:
            return error_response(message="Tier with the given id does not exist.", status_code=404)

        progress_rows = {row.tier_id: row for row in get_or_create_tier_progress(request.user)}
        progress = progress_rows.get(tier.id)
        if progress is None:
            return error_response(message="Tier progress could not be resolved.", status_code=404)

        serializer = TierProgressSerializer(progress, context={"request": request})
        return success_response(serializer.data, message="Tier progress fetched successfully")
