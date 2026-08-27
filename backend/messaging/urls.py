from django.urls import path

from .views import (
    ConversationListCreateView,
    ConversationReadView,
    EligibleRecipientsView,
    MessageDetailView,
    MessageListCreateView,
    MessageReactionView,
    UnreadCountView,
)

urlpatterns = [
    path("recipients/", EligibleRecipientsView.as_view(), name="messaging-recipients"),
    path("unread-count/", UnreadCountView.as_view(), name="messaging-unread-count"),
    path("", ConversationListCreateView.as_view(), name="conversation-list-create"),
    path("<int:conversation_id>/messages/", MessageListCreateView.as_view(), name="conversation-messages"),
    path(
        "<int:conversation_id>/messages/<int:message_id>/",
        MessageDetailView.as_view(),
        name="message-detail",
    ),
    path(
        "<int:conversation_id>/messages/<int:message_id>/reactions/",
        MessageReactionView.as_view(),
        name="message-reactions",
    ),
    path("<int:conversation_id>/read/", ConversationReadView.as_view(), name="conversation-read"),
]
