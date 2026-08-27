from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from common.pagination import Pagination
from common.response import error_response, success_response

from .models import Conversation, Message
from .permissions import IsConversationParticipant
from .serializers import (
    ConversationSerializer,
    EditMessageSerializer,
    MessageSerializer,
    ParticipantSerializer,
    ReactionInputSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)
from .services import (
    MessageDeleteError,
    MessageEditError,
    MessagingPermissionError,
    delete_message,
    edit_message,
    get_eligible_recipients,
    get_unread_counts,
    mark_conversation_read,
    send_message,
    start_conversation,
    toggle_reaction,
)
from .throttling import MessageSendThrottle
from .validators import validate_message_attachment

UserModel = get_user_model()


class EligibleRecipientsView(generics.ListAPIView):
    """Users the current user may start a NEW conversation with. Returned as a
    plain array (not paginated) — matches the rest of the codebase's convention
    for picker-style nested lists. Capped at RESULT_LIMIT and filtered by an
    optional `search` query param (same convention as courses/progress/pathways
    views) so the client never has to fetch — and client-side filter — every
    eligible recipient an admin can see (potentially hundreds of students)."""

    serializer_class = ParticipantSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    RESULT_LIMIT = 20

    def get_queryset(self):
        queryset = get_eligible_recipients(self.request.user).select_related("profile")

        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search))

        return queryset.order_by("name")[: self.RESULT_LIMIT]

    def list(self, request, *args, **kwargs):
        recipients = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(recipients, many=True)
        return success_response(serializer.data, message="Eligible recipients fetched successfully")


class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(participant_one=user) | Q(participant_two=user)
        ).select_related("participant_one", "participant_two", "participant_one__profile", "participant_two__profile")

    def list(self, request, *args, **kwargs):
        conversations = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(conversations)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Conversations fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipient_id = serializer.validated_data["recipient_id"]

        try:
            recipient = UserModel.objects.get(pk=recipient_id)
        except UserModel.DoesNotExist:
            return error_response(message="Recipient does not exist.", status_code=404)

        try:
            conversation = start_conversation(request.user, recipient)
        except MessagingPermissionError as exc:
            return error_response(message=str(exc), status_code=403)

        return success_response(
            ConversationSerializer(conversation, context={"request": request}).data,
            message="Conversation ready",
            status_code=201,
        )


class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsConversationParticipant]
    pagination_class = Pagination
    # Plain text sends use JSON; sends with an attachment use multipart —
    # this view has to accept both.
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_throttles(self):
        if self.request.method == "POST":
            return [MessageSendThrottle()]
        return []

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SendMessageSerializer
        return MessageSerializer

    def _get_conversation(self):
        try:
            conversation = Conversation.objects.get(pk=self.kwargs["conversation_id"])
        except Conversation.DoesNotExist:
            return None
        self.check_object_permissions(self.request, conversation)
        return conversation

    def list(self, request, *args, **kwargs):
        conversation = self._get_conversation()
        if conversation is None:
            return error_response(message="Conversation does not exist.", status_code=404)

        messages = conversation.messages.select_related("sender").prefetch_related("reactions")
        page = self.paginate_queryset(messages)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Messages fetched successfully")

    def create(self, request, *args, **kwargs):
        conversation = self._get_conversation()
        if conversation is None:
            return error_response(message="Conversation does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attachment = serializer.validated_data.get("attachment")
        attachment_category = validate_message_attachment(attachment) if attachment else None

        message = send_message(
            conversation,
            request.user,
            body=serializer.validated_data.get("body", ""),
            attachment=attachment,
            attachment_category=attachment_category,
        )

        return success_response(
            MessageSerializer(message, context={"request": request}).data,
            message="Message sent successfully",
            status_code=201,
        )


class MessageDetailView(generics.GenericAPIView):
    http_method_names = ["patch", "delete", "head", "options"]
    permission_classes = [IsAuthenticated, IsConversationParticipant]
    serializer_class = EditMessageSerializer

    def _get_conversation_and_message(self, conversation_id, message_id):
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            return None, None

        self.check_object_permissions(self.request, conversation)

        try:
            message = conversation.messages.get(pk=message_id)
        except Message.DoesNotExist:
            return conversation, None

        return conversation, message

    def patch(self, request, conversation_id, message_id):
        conversation, message = self._get_conversation_and_message(conversation_id, message_id)
        if conversation is None:
            return error_response(message="Conversation does not exist.", status_code=404)
        if message is None:
            return error_response(message="Message does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            message = edit_message(message, request.user, serializer.validated_data["body"])
        except MessageEditError as exc:
            return error_response(message=str(exc), status_code=403)

        return success_response(
            MessageSerializer(message, context={"request": request}).data,
            message="Message updated successfully",
        )

    def delete(self, request, conversation_id, message_id):
        conversation, message = self._get_conversation_and_message(conversation_id, message_id)
        if conversation is None:
            return error_response(message="Conversation does not exist.", status_code=404)
        if message is None:
            return error_response(message="Message does not exist.", status_code=404)

        try:
            message = delete_message(message, request.user)
        except MessageDeleteError as exc:
            return error_response(message=str(exc), status_code=403)

        return success_response(
            MessageSerializer(message, context={"request": request}).data,
            message="Message deleted successfully",
        )


class MessageReactionView(generics.GenericAPIView):
    http_method_names = ["post", "head", "options"]
    permission_classes = [IsAuthenticated, IsConversationParticipant]
    serializer_class = ReactionInputSerializer

    def post(self, request, conversation_id, message_id):
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            return error_response(message="Conversation does not exist.", status_code=404)

        self.check_object_permissions(request, conversation)

        try:
            message = conversation.messages.get(pk=message_id)
        except Message.DoesNotExist:
            return error_response(message="Message does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = toggle_reaction(message, request.user, serializer.validated_data["emoji"])

        return success_response(
            MessageSerializer(message, context={"request": request}).data,
            message="Reaction updated",
        )


class ConversationReadView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    permission_classes = [IsAuthenticated, IsConversationParticipant]

    def patch(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            return error_response(message="Conversation does not exist.", status_code=404)

        self.check_object_permissions(request, conversation)
        mark_conversation_read(conversation, request.user)

        return success_response(
            ConversationSerializer(conversation, context={"request": request}).data,
            message="Conversation marked as read",
        )


class UnreadCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(get_unread_counts(request.user), message="Unread count fetched successfully")
