from rest_framework.permissions import BasePermission

from courses.models import Course
from courses.services import is_course_instructor
from enrollments.models import Enrollment
from modules.models import Module

from .models import Assignment, AssignmentAttachment, AssignmentSubmission, AssignmentSubmissionFile


def _resolve_course(obj):
    if isinstance(obj, Assignment):
        return obj.course
    if isinstance(obj, AssignmentAttachment):
        return obj.assignment.course
    if isinstance(obj, AssignmentSubmission):
        return obj.assignment.course
    if isinstance(obj, AssignmentSubmissionFile):
        return obj.submission.assignment.course
    return None


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

        if request.method != "POST":
            return True

        return is_course_instructor(user, self._resolve_course_for_create(request, view))

    def _resolve_course_for_create(self, request, view):
        if "assignment_id" in view.kwargs:
            try:
                return Assignment.objects.select_related("course").get(
                    pk=view.kwargs["assignment_id"]
                ).course
            except Assignment.DoesNotExist:
                return None

        course_id = request.data.get("course")
        module_id = request.data.get("module")
        if not course_id and not module_id:
            return None
        if course_id:
            try:
                return Course.objects.get(pk=course_id)
            except Course.DoesNotExist:
                return None
        try:
            return Module.objects.select_related("course").get(pk=module_id).course
        except Module.DoesNotExist:
            return None

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin:
            return True

        course = _resolve_course(obj)
        if course is None:
            return False
        return is_course_instructor(user, course)


class IsEnrolledStudentOrAdmin(BasePermission):
    message = "You do not have permission to view this assignment."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(user.is_admin or user.is_student or user.is_teacher)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin:
            return True

        course = _resolve_course(obj)
        if course is None:
            return False

        if user.is_teacher:
            return is_course_instructor(user, course)

        return Enrollment.objects.filter(
            student=user, course=course, status=Enrollment.EnrollmentStatus.ACTIVE
        ).exists()
