from rest_framework.permissions import BasePermission

from enrollments.models import Enrollment


class IsEnrolledStudentOrAdmin(BasePermission):
    message = "You do not have permission to view this lesson."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(user.is_admin or user.is_student)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin:
            return True

        return Enrollment.objects.filter(
            student=user,
            course=obj.module.course,
            status=Enrollment.EnrollmentStatus.ACTIVE,
        ).exists()
