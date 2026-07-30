from rest_framework.permissions import BasePermission

from courses.models import Course
from courses.services import is_course_instructor


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
            course_id = request.data.get("course")
            if not course_id:
                return False
            try:
                course = Course.objects.get(pk=course_id)
            except Course.DoesNotExist:
                return False
            return is_course_instructor(user, course)

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin:
            return True
        return is_course_instructor(user, obj.course)
