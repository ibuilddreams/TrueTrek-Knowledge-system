from rest_framework.permissions import BasePermission

from .services import can_access_room


class CanAccessRoom(BasePermission):
    """A course's War Room is open to admin, its instructors, and its
    ACTIVE-enrolled students — see warroom.services.can_access_room."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        course = view.get_course()
        if course is None:
            return True  # let the view 404 on a missing course

        return can_access_room(user, course)

    def has_object_permission(self, request, view, obj):
        return can_access_room(request.user, obj.course)
