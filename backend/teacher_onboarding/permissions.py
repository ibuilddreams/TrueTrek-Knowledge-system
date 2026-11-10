from rest_framework.permissions import BasePermission

from .services import can_teach


class IsApprovedTeacher(BasePermission):
    """A teacher whose account is cleared to author content.

    Lives here rather than in `users.permissions` because approval is this
    app's concept — `users` has no reason to know what a teacher application
    is. Composed as `(IsAdmin | IsApprovedTeacher)` wherever `(IsAdmin |
    IsTeacher)` used to stand, so admins are unaffected.
    """

    message = (
        "Your teacher application is still under review. "
        "You'll be able to create courses as soon as it has been approved."
    )

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_teacher
            and can_teach(user)
        )
