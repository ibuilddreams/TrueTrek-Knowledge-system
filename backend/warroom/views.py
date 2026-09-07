from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course
from messaging.validators import validate_message_attachment

from .models import RoomMessage
from .permissions import CanAccessRoom
from .serializers import (
    EditRoomMessageSerializer,
    RoomMessageSerializer,
    RoomSerializer,
    SendRoomMessageSerializer,
)
from .services import (
    RoomMessageDeleteError,
    RoomMessageEditError,
    delete_room_message,
    edit_room_message,
    get_my_rooms,
    send_room_message,
)
from .throttling import RoomMessageSendThrottle


class RoomListView(generics.ListAPIView):
    """Every course the current user has a War Room in — every enrolled
    course for a student, every instructed course for a teacher, all
    courses for an admin."""

    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        return get_my_rooms(self.request.user).order_by("title")

    def list(self, request, *args, **kwargs):
        rooms = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(rooms)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Rooms fetched successfully")


class RoomMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanAccessRoom]
    pagination_class = Pagination
    # Plain text sends use JSON; sends with an attachment use multipart.
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_course(self):
        return Course.objects.filter(pk=self.kwargs["course_id"]).first()

    def get_throttles(self):
        if self.request.method == "POST":
            return [RoomMessageSendThrottle()]
        return []

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SendRoomMessageSerializer
        return RoomMessageSerializer

    def list(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)

        messages = RoomMessage.objects.filter(course=course).select_related("sender", "sender__profile")
        page = self.paginate_queryset(messages)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Messages fetched successfully")

    def create(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attachment = serializer.validated_data.get("attachment")
        attachment_category = validate_message_attachment(attachment) if attachment else None

        message = send_room_message(
            course,
            request.user,
            body=serializer.validated_data.get("body", ""),
            attachment=attachment,
            attachment_category=attachment_category,
        )

        return success_response(
            RoomMessageSerializer(message, context={"request": request}).data,
            message="Message sent successfully",
            status_code=201,
        )


class RoomMessageDetailView(generics.GenericAPIView):
    http_method_names = ["patch", "delete", "head", "options"]
    permission_classes = [CanAccessRoom]
    serializer_class = EditRoomMessageSerializer

    def get_course(self):
        return Course.objects.filter(pk=self.kwargs["course_id"]).first()

    def _get_message(self, course):
        return RoomMessage.objects.filter(pk=self.kwargs["message_id"], course=course).first()

    def patch(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)
        message = self._get_message(course)
        if message is None:
            return error_response(message="Message does not exist.", status_code=404)
        self.check_object_permissions(request, message)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            message = edit_room_message(message, request.user, serializer.validated_data["body"])
        except RoomMessageEditError as exc:
            return error_response(message=str(exc), status_code=403)

        return success_response(
            RoomMessageSerializer(message, context={"request": request}).data,
            message="Message updated successfully",
        )

    def delete(self, request, *args, **kwargs):
        course = self.get_course()
        if course is None:
            return error_response(message="Course does not exist.", status_code=404)
        message = self._get_message(course)
        if message is None:
            return error_response(message="Message does not exist.", status_code=404)
        self.check_object_permissions(request, message)

        try:
            message = delete_room_message(message, request.user)
        except RoomMessageDeleteError as exc:
            return error_response(message=str(exc), status_code=403)

        return success_response(
            RoomMessageSerializer(message, context={"request": request}).data,
            message="Message deleted successfully",
        )
