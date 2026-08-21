from rest_framework.permissions import BasePermission


class CanUseAICourseGeneration(BasePermission):
    """Admin-only in v1 — exactly what the client asked for. Phase 3 extends this to
    teachers with an AIEntitlement.is_enabled flag and remaining monthly quota; kept as
    its own permission class (rather than reusing users.permissions.IsAdmin directly)
    so that later change is a one-file edit."""

    message = "You do not have permission to use AI course generation."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)
