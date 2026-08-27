from django.contrib import admin

from .models import Conversation, Message, MessageReaction


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("sender", "body", "is_read", "is_deleted", "created_at")
    readonly_fields = ("sender", "body", "is_read", "is_deleted", "created_at")
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "participant_one", "participant_two", "last_message_at")
    search_fields = ("participant_one__email", "participant_two__email")
    autocomplete_fields = ("participant_one", "participant_two")
    inlines = (MessageInline,)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "is_read", "is_edited", "is_deleted", "created_at")
    list_filter = ("is_read", "is_edited", "is_deleted", "attachment_type")
    search_fields = ("sender__email", "body")
    autocomplete_fields = ("conversation", "sender")


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ("id", "message", "user", "emoji", "created_at")
    search_fields = ("user__email", "emoji")
    autocomplete_fields = ("message", "user")
