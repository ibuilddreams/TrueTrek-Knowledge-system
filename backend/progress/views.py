from rest_framework import generics

from common.pagination import Pagination
from common.response import error_response, success_response
from enrollments.models import Enrollment
from users.permissions import IsStudent

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
        if not Enrollment.objects.filter(student=request.user, course_id=course_id).exists():
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
