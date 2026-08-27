from rest_framework.permissions import BasePermission


class IsConversationParticipant(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.pk in (obj.participant_one_id, obj.participant_two_id)
