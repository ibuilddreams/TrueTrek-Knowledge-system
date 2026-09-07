from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course

from .models import FeedPost
from .permissions import FeedPostPermission
from .serializers import FeedPostCreateSerializer, FeedPostSerializer, FeedPostUpdateSerializer
from .validators import validate_feed_attachment


class FeedPostListCreateView(generics.ListCreateAPIView):
    """List a course's feed (any eligible viewer) / publish a new post (course instructor or admin)."""

    permission_classes = [FeedPostPermission]
    pagination_class = Pagination
    # Plain text-only posts use JSON; posts with an image/video use multipart.
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_course(self):
        return Course.objects.filter(pk=self.kwargs["course_id"]).first()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FeedPostCreateSerializer
        return FeedPostSerializer

    def list(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)

        posts = FeedPost.objects.filter(course=course).select_related("teacher", "teacher__profile")
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Feed posts fetched successfully")

    def create(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attachment = serializer.validated_data.get("attachment")
        attachment_category = validate_feed_attachment(attachment) if attachment else None

        post = FeedPost.objects.create(
            course=course,
            teacher=request.user,
            title=serializer.validated_data.get("title", ""),
            caption=serializer.validated_data.get("caption", ""),
            attachment=attachment,
            attachment_original_name=attachment.name if attachment else "",
            attachment_type=attachment_category or "",
            attachment_size=attachment.size if attachment else None,
        )

        return success_response(
            FeedPostSerializer(post, context={"request": request}).data,
            message="Post published successfully",
            status_code=201,
        )


class FeedPostDetailView(generics.GenericAPIView):
    """Edit (caption/title only) or delete a single feed post — the post's
    own author or an admin only, not just any co-instructor."""

    http_method_names = ["patch", "delete", "head", "options"]
    permission_classes = [FeedPostPermission]
    serializer_class = FeedPostUpdateSerializer

    def get_course(self):
        return Course.objects.filter(pk=self.kwargs["course_id"]).first()

    def _get_post(self, course):
        return FeedPost.objects.filter(pk=self.kwargs["post_id"], course=course).first()

    def patch(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)

        post = self._get_post(course)
        if post is None:
            return error_response(message="Post does not exist.", status_code=404)
        self.check_object_permissions(request, post)

        serializer = self.get_serializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, message="Post updated successfully")

    def delete(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)

        post = self._get_post(course)
        if post is None:
            return error_response(message="Post does not exist.", status_code=404)
        self.check_object_permissions(request, post)

        if post.attachment:
            post.attachment.delete(save=False)
        post.delete()
        return success_response(None, message="Post deleted successfully")
