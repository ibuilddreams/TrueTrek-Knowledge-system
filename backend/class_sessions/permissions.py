from rest_framework.permissions import BasePermission


class IsTeacherOrAdmin(BasePermission):
    """Gate for the scheduling endpoints.

    Which *courses* a teacher may schedule against is a separate question,
    answered per request against `CourseInstructor` (see
    `serializers.ClassSessionWriteSerializer` and `services.schedule_class`)
    — this only keeps students out of the teacher-side API. Admins are
    included so support can inspect and fix a timetable, the same way
    `services.is_host` lets them sit in on a class.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_teacher or user.is_admin))
