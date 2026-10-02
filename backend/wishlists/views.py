from rest_framework import generics

from common.response import error_response, success_response
from users.permissions import IsStudent

from .models import WishlistItem
from .serializers import WishlistItemSerializer, WishlistItemWriteSerializer


class WishlistItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsStudent]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related(
            "course", "course__category"
        ).prefetch_related("course__tags")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return WishlistItemWriteSerializer
        return WishlistItemSerializer

    def list(self, request, *args, **kwargs):
        items = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(items, many=True)
        return success_response(serializer.data, message="Wishlist fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(user=request.user)
        return success_response(
            WishlistItemSerializer(item, context=self.get_serializer_context()).data,
            message="Course added to wishlist",
            status_code=201,
        )


class WishlistItemDetailView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def delete(self, request, course_id):
        deleted_count, _ = WishlistItem.objects.filter(
            user=request.user, course_id=course_id
        ).delete()
        if not deleted_count:
            return error_response(message="This course is not in your wishlist.", status_code=404)
        return success_response(None, message="Course removed from wishlist")
