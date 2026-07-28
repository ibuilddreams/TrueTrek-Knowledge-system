from rest_framework import generics

from common.pagination import Pagination
from common.response import error_response, success_response
from enrollments.models import Enrollment
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Quiz, QuizResult
from users.permissions import IsAdmin, IsStudent

from .models import CourseProgress, LessonProgress, ModuleProgress
from .serializers import CourseProgressSerializer, LessonProgressSerializer, ModuleProgressSerializer


class CourseProgressListView(generics.ListAPIView):
    serializer_class = CourseProgressSerializer
    permission_classes = [IsStudent]
    pagination_class = Pagination

    def get_queryset(self):
        return CourseProgress.objects.filter(student=self.request.user).select_related(
            "course", "course__category"
        )

    def list(self, request, *args, **kwargs):
        progress = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(progress)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Progress fetched successfully")


class CourseProgressDetailView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request, course_id):
        if not Enrollment.objects.filter(
            student=request.user,
            course_id=course_id,
            status=Enrollment.EnrollmentStatus.ACTIVE,
        ).exists():
            return error_response(
                message="You are not enrolled in this course.", status_code=403
            )

        course_progress = (
            CourseProgress.objects.filter(student=request.user, course_id=course_id)
            .select_related("course", "course__category")
            .first()
        )
        module_progress = ModuleProgress.objects.filter(
            student=request.user, module__course_id=course_id
        ).select_related("module")
        lesson_progress = LessonProgress.objects.filter(
            student=request.user, lesson__module__course_id=course_id
        ).select_related("lesson")

        data = {
            "course_progress": CourseProgressSerializer(course_progress).data
            if course_progress
            else None,
            "modules": ModuleProgressSerializer(module_progress, many=True).data,
            "lessons": LessonProgressSerializer(lesson_progress, many=True).data,
        }
        return success_response(data, message="Course progress fetched successfully")


class ModuleProgressDetailView(generics.GenericAPIView):
    permission_classes = [IsAdmin | IsStudent]

    def get(self, request, module_id):
        try:
            module = Module.objects.select_related("course").get(pk=module_id)
        except Module.DoesNotExist:
            return error_response(message="Module with the given id does not exist.", status_code=404)

        if not Enrollment.objects.filter(
            student=request.user,
            course_id=module.course_id,
            status=Enrollment.EnrollmentStatus.ACTIVE,
        ).exists():
            return error_response(
                message="You are not enrolled in this course.", status_code=403
            )

        total_lessons = Lesson.objects.filter(module=module).count()
        completed_lessons = LessonProgress.objects.filter(
            student=request.user, lesson__module=module, is_completed=True
        ).count()

        total_quizzes = Quiz.objects.filter(module=module).count()
        completed_quizzes = (
            QuizResult.objects.filter(attempt__student=request.user, attempt__quiz__module=module)
            .values("attempt__quiz")
            .distinct()
            .count()
        )

        total_items = total_lessons + total_quizzes
        completed_items = completed_lessons + completed_quizzes
        completion_percentage = round((completed_items / total_items * 100), 2) if total_items else 0

        data = {
            "module": {"id": module.id, "title": module.title},
            "lessons": {"total": total_lessons, "completed": completed_lessons},
            "quizzes": {"total": total_quizzes, "completed": completed_quizzes},
            "completion_percentage": completion_percentage,
        }
        return success_response(data, message="Module progress fetched successfully")
