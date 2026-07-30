from rest_framework.permissions import BasePermission

from courses.services import is_course_instructor
from enrollments.models import Enrollment
from modules.models import Module


class IsEnrolledStudentOrAdmin(BasePermission):
    message = "You do not have permission to view this lesson."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(user.is_admin or user.is_student or user.is_teacher)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin:
            return True

        if user.is_teacher:
            return is_course_instructor(user, obj.module.course)

        return Enrollment.objects.filter(
            student=user,
            course=obj.module.course,
            status=Enrollment.EnrollmentStatus.ACTIVE,
        ).exists()


class IsCourseInstructorOrAdmin(BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_admin:
            return True
        if not user.is_teacher:
            return False

        if request.method == "POST":
            module_id = request.data.get("module")
            if not module_id:
                return False
            try:
                module = Module.objects.select_related("course").get(pk=module_id)
            except Module.DoesNotExist:
                return False
            return is_course_instructor(user, module.course)

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin:
            return True
        return is_course_instructor(user, obj.module.course)
