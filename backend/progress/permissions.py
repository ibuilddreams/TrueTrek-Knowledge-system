from rest_framework.permissions import BasePermission

from courses.models import Course
from courses.services import is_course_instructor


class IsCourseInstructorOrAdmin(BasePermission):
    message = "You do not have permission to view this course's progress."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_admin:
            return True
        if not user.is_teacher:
            return False

        try:
            course = Course.objects.get(pk=view.kwargs.get("course_id"))
        except Course.DoesNotExist:
            return False
        return is_course_instructor(user, course)
