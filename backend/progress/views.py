from django.db.models import Count, Max, Prefetch, Q
from rest_framework import generics

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course
from enrollments.models import Enrollment
from enrollments.services import can_view_student_in_course, get_visible_enrollments
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Quiz, QuizResult
from users.permissions import IsAdmin, IsStudent

from .models import CourseProgress, LessonProgress, ModuleProgress
from .permissions import IsCourseInstructorOrAdmin
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

        total_quizzes = Quiz.objects.filter(module=module, status=Status.PUBLISHED).count()
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


class CourseLessonProgressListView(generics.GenericAPIView):
    """Teacher/admin-facing lesson-completion dashboard for one course."""

    permission_classes = [IsCourseInstructorOrAdmin]
    pagination_class = Pagination

    def get(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return error_response(message="Course with the given id does not exist.", status_code=404)

        lessons_qs = Lesson.objects.filter(module__course=course)
        module_id = request.query_params.get("module")
        if module_id:
            lessons_qs = lessons_qs.filter(module_id=module_id)
        total_lessons = lessons_qs.count()
        lesson_ids = list(lessons_qs.values_list("id", flat=True))

        enrollments = get_visible_enrollments(course, request.user).select_related("student")

        search = request.query_params.get("search")
        if search:
            enrollments = enrollments.filter(
                Q(student__name__icontains=search) | Q(student__email__icontains=search)
            )
        enrollments = list(enrollments)
        student_ids = [enrollment.student_id for enrollment in enrollments]

        completed_counts = dict(
            LessonProgress.objects.filter(
                student_id__in=student_ids, lesson_id__in=lesson_ids, is_completed=True
            )
            .values("student_id")
            .annotate(count=Count("id"))
            .values_list("student_id", "count")
        )
        last_completed_map = dict(
            LessonProgress.objects.filter(
                student_id__in=student_ids, lesson_id__in=lesson_ids, is_completed=True
            )
            .values("student_id")
            .annotate(latest=Max("completed_at"))
            .values_list("student_id", "latest")
        )

        rows = []
        for enrollment in enrollments:
            completed = completed_counts.get(enrollment.student_id, 0)
            percentage = round((completed / total_lessons) * 100, 2) if total_lessons else 0
            rows.append(
                {
                    "student_id": enrollment.student_id,
                    "name": enrollment.student.name,
                    "email": enrollment.student.email,
                    "lessons_completed": completed,
                    "total_lessons": total_lessons,
                    "pending_lessons": total_lessons - completed,
                    "completion_percentage": percentage,
                    "last_completed_at": last_completed_map.get(enrollment.student_id),
                }
            )

        ordering = request.query_params.get("ordering")
        if ordering in ("completion_percentage", "-completion_percentage"):
            rows.sort(key=lambda row: row["completion_percentage"], reverse=ordering.startswith("-"))

        total_students = len(rows)
        stats = {
            "total_students": total_students,
            "completed_lessons": sum(row["lessons_completed"] for row in rows),
            "pending_lessons": sum(row["pending_lessons"] for row in rows),
            "average_completion": (
                round(sum(row["completion_percentage"] for row in rows) / total_students, 2)
                if total_students
                else 0
            ),
        }

        page = self.paginate_queryset(rows)
        paginated_data = self.paginator.get_paginated_response(page).data
        data = {"stats": stats, **paginated_data}
        return success_response(data, message="Lesson progress fetched successfully")


class StudentLessonProgressDetailView(generics.GenericAPIView):
    """Per-student, per-module, per-lesson completion breakdown for one course."""

    permission_classes = [IsCourseInstructorOrAdmin]

    def get(self, request, course_id, student_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return error_response(message="Course with the given id does not exist.", status_code=404)

        if not can_view_student_in_course(request.user, student_id, course):
            return error_response(
                message="This student is not enrolled in this course.", status_code=404
            )

        modules = Module.objects.filter(course=course).order_by("order").prefetch_related(
            Prefetch("lessons", queryset=Lesson.objects.order_by("order"))
        )
        lesson_progress_map = {
            row.lesson_id: row
            for row in LessonProgress.objects.filter(
                student_id=student_id, lesson__module__course=course
            )
        }

        module_data = []
        for module in modules:
            lessons_data = []
            for lesson in module.lessons.all():
                progress = lesson_progress_map.get(lesson.id)
                lessons_data.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "is_completed": bool(progress and progress.is_completed),
                        "completed_at": progress.completed_at if progress else None,
                    }
                )
            module_data.append({"id": module.id, "title": module.title, "lessons": lessons_data})

        data = {"course_id": course.id, "student_id": int(student_id), "modules": module_data}
        return success_response(data, message="Student lesson progress fetched successfully")
