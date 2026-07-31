from rest_framework.permissions import BasePermission

from courses.models import Course
from courses.services import is_course_instructor
from modules.models import Module

from .models import Choice, Question, Quiz


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

        course = self._resolve_course_for_create(request, view)
        if course is None:
            return False
        return is_course_instructor(user, course)

    def _resolve_course_for_create(self, request, view):
        if "quiz_id" in view.kwargs:
            try:
                return Quiz.objects.select_related("course").get(pk=view.kwargs["quiz_id"]).course
            except Quiz.DoesNotExist:
                return None

        if "question_id" in view.kwargs:
            try:
                question = Question.objects.select_related("quiz__course").get(
                    pk=view.kwargs["question_id"]
                )
            except Question.DoesNotExist:
                return None
            return question.quiz.course

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

        if isinstance(obj, Quiz):
            course = obj.course
        elif isinstance(obj, Question):
            course = obj.quiz.course
        elif isinstance(obj, Choice):
            course = obj.question.quiz.course
        else:
            return False

        return is_course_instructor(user, course)
