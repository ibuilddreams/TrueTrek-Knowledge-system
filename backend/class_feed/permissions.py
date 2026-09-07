from rest_framework.permissions import SAFE_METHODS, BasePermission

from courses.services import is_course_instructor
from enrollments.models import Enrollment


def can_view_feed(user, course):
    if user.is_admin:
        return True
    if user.is_teacher:
        return is_course_instructor(user, course)
    if user.is_student:
        return Enrollment.objects.filter(
            student=user, course=course, status=Enrollment.EnrollmentStatus.ACTIVE
        ).exists()
    return False


def can_manage_feed(user, course):
    """Any admin or course instructor may post to a course's feed."""
    if user.is_admin:
        return True
    return user.is_teacher and is_course_instructor(user, course)


class FeedPostPermission(BasePermission):
    """Read: admin, course instructor, or an ACTIVE-enrolled student.
    Create: admin or course instructor. Edit/delete: admin or the post's
    own author only (not just any co-instructor) — enforced at the object
    level since only the resolved post carries `teacher`."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        course = view.get_course()
        if course is None:
            return True  # let the view 404 on a missing course

        if request.method in SAFE_METHODS:
            return can_view_feed(user, course)
        if request.method == "POST":
            return can_manage_feed(user, course)
        return True  # PATCH/DELETE: ownership is checked in has_object_permission

    def has_object_permission(self, request, view, obj):
        user = request.user
        if request.method in SAFE_METHODS:
            return can_view_feed(user, obj.course)
        if request.method == "POST":
            return can_manage_feed(user, obj.course)
        return user.is_admin or obj.teacher_id == user.pk
