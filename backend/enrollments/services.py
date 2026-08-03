from django.contrib.auth import get_user_model
from django.db import transaction

from common.import_files import (
    ImportFileError,
    build_sample_csv,
    build_sample_workbook,
    parse_tabular_file,
)
from common.models import Status
from courses.models import Course
from courses.serializers import CourseDetailSerializer
from lessons.models import Lesson
from progress.models import CourseProgress, LessonProgress, ModuleProgress
from quizzes.models import Quiz

from .models import Enrollment

UserModel = get_user_model()

ENROLLMENT_IMPORT_HEADERS = ["Student Email"]
ENROLLMENT_COURSE_HEADERS = ["Course Code", "Course Title"]

ENROLLMENT_SAMPLE_ROWS = [
    {"Student Email": "john@example.com", "Course Code": "CS101"},
    {"Student Email": "jane@example.com", "Course Code": "MATH201"},
]


def _resolve_course(row_data):
    course_code = row_data.get("Course Code", "").strip().upper()
    course_title = row_data.get("Course Title", "").strip()

    if course_code:
        course = Course.objects.filter(code__iexact=course_code).first()
        if course is None:
            raise ValueError(f"No course found with code '{course_code}'.")
        return course

    if course_title:
        course = Course.objects.filter(title__iexact=course_title).first()
        if course is None:
            raise ValueError(f"No course found with title '{course_title}'.")
        return course

    raise ValueError("Course Code or Course Title is required.")


def _create_imported_enrollment(row_data):
    email = UserModel.objects.normalize_email(row_data.get("Student Email", "").strip())

    if not email:
        raise ValueError("Student Email is required.")

    student = UserModel.objects.filter(
        email__iexact=email, role=UserModel.Roles.STUDENT
    ).first()
    if student is None:
        raise ValueError(f"No student found with email '{email}'.")

    if student.account_status != UserModel.AccountStatus.ACTIVE:
        raise ValueError("This student's account is not active.")

    course = _resolve_course(row_data)

    if course.status != Status.PUBLISHED:
        raise ValueError("Enrollment is only allowed for published courses.")

    if Enrollment.objects.filter(student=student, course=course).exists():
        raise ValueError("This student is already enrolled in this course.")

    with transaction.atomic():
        enrollment = Enrollment.objects.create(student=student, course=course)

    return {
        "id": enrollment.id,
        "student_email": student.email,
        "student_name": student.name,
        "course_id": course.id,
        "course_title": course.title,
        "course_code": course.code,
        "status": enrollment.status,
    }


def bulk_import_enrollments(uploaded_file):
    rows = parse_tabular_file(
        uploaded_file,
        ENROLLMENT_IMPORT_HEADERS,
        optional_headers=ENROLLMENT_COURSE_HEADERS,
        require_one_of=ENROLLMENT_COURSE_HEADERS,
    )

    created = []
    errors = []

    for entry in rows:
        row_number = entry["row_number"]
        row_data = entry["data"]
        try:
            created.append(_create_imported_enrollment(row_data))
        except Exception as exc:
            errors.append(
                {
                    "row": row_number,
                    "error": str(exc),
                    "data": {
                        "student_email": row_data.get("Student Email", ""),
                        "course_code": row_data.get("Course Code", "")
                        or row_data.get("Course Title", ""),
                    },
                }
            )

    return {
        "total_rows": len(rows),
        "success_count": len(created),
        "failed_count": len(errors),
        "created": created,
        "errors": errors,
    }


def get_enrollment_import_sample(file_format):
    format_key = (file_format or "csv").lower()
    headers = ["Student Email", "Course Code"]
    if format_key == "xlsx":
        return (
            build_sample_workbook(headers, ENROLLMENT_SAMPLE_ROWS),
            "enrollment_import_sample.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    if format_key == "csv":
        return (
            build_sample_csv(headers, ENROLLMENT_SAMPLE_ROWS),
            "enrollment_import_sample.csv",
            "text/csv",
        )
    raise ImportFileError("Sample format must be csv or xlsx.")


def get_student_enrolled_course_detail(student, course_id, request=None):
    enrollment = (
        Enrollment.objects.filter(student=student, course_id=course_id)
        .select_related("course", "course__category")
        .prefetch_related(
            "course__tags",
            "course__instructors__instructor",
            "course__modules__lessons",
            "course__modules__assignments",
            "course__modules__quizzes",
        )
        .first()
    )
    if enrollment is None:
        return None

    course = enrollment.course
    course_progress = CourseProgress.objects.filter(
        student=student, course_id=course_id
    ).first()

    modules = list(course.modules.all())
    module_ids = [module.id for module in modules]
    lesson_ids = list(
        Lesson.objects.filter(module_id__in=module_ids).values_list("id", flat=True)
    )

    module_progress_map = {
        row.module_id: row
        for row in ModuleProgress.objects.filter(student=student, module_id__in=module_ids)
    }
    completed_lesson_ids = set(
        LessonProgress.objects.filter(
            student=student, lesson_id__in=lesson_ids, is_completed=True
        ).values_list("lesson_id", flat=True)
    )

    modules_data = []
    for module in modules:
        lessons = list(module.lessons.all())
        quizzes = list(module.quizzes.all())
        assignments = list(module.assignments.all())
        completed_lessons = sum(1 for lesson in lessons if lesson.id in completed_lesson_ids)
        module_progress = module_progress_map.get(module.id)
        modules_data.append(
            {
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "order": module.order,
                "completion_percentage": (
                    round(float(module_progress.completion_percentage), 2)
                    if module_progress
                    else 0
                ),
                "is_completed": bool(module_progress.is_completed) if module_progress else False,
                "lessons": [
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "content_type": lesson.content_type,
                        "duration_minutes": lesson.duration_minutes,
                        "order": lesson.order,
                        "is_completed": lesson.id in completed_lesson_ids,
                    }
                    for lesson in lessons
                ],
                "quizzes": [
                    {
                        "id": quiz.id,
                        "title": quiz.title,
                        "status": quiz.status,
                        "order": quiz.order,
                    }
                    for quiz in quizzes
                ],
                "assignments": [
                    {
                        "id": assignment.id,
                        "title": assignment.title,
                        "status": assignment.status,
                        "due_date": assignment.due_date,
                        "order": assignment.order,
                    }
                    for assignment in assignments
                ],
                "stats": {
                    "total_lessons": len(lessons),
                    "completed_lessons": completed_lessons,
                    "total_quizzes": len(quizzes),
                    "total_assignments": len(assignments),
                },
            }
        )

    total_lessons = len(lesson_ids)
    completed_lessons = len(completed_lesson_ids)
    total_quizzes = Quiz.objects.filter(course_id=course_id).count()
    completion_percentage = (
        round(float(course_progress.completion_percentage), 2) if course_progress else 0
    )

    return {
        "enrollment": {
            "id": enrollment.id,
            "status": enrollment.status,
            "enrolled_at": enrollment.enrolled_at,
            "completion_percentage": completion_percentage,
            "is_completed": bool(course_progress.is_completed) if course_progress else False,
        },
        "course": CourseDetailSerializer(course, context={"request": request}).data,
        "modules": modules_data,
        "stats": {
            "total_modules": len(modules),
            "completed_modules": sum(1 for module in modules_data if module["is_completed"]),
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "total_quizzes": total_quizzes,
            "completion_percentage": completion_percentage,
        },
    }


def get_visible_enrollments(course, user):
    """Active enrollments in a course visible to user — all for admins, only their own section for teachers."""
    enrollments = Enrollment.objects.filter(course=course, status=Enrollment.EnrollmentStatus.ACTIVE)
    if not user.is_admin:
        enrollments = enrollments.filter(teacher=user)
    return enrollments


def can_view_student_in_course(user, student_id, course):
    if user.is_admin:
        return Enrollment.objects.filter(student_id=student_id, course=course).exists()
    return Enrollment.objects.filter(student_id=student_id, course=course, teacher=user).exists()


def get_student_certificates(student):
    completed = (
        CourseProgress.objects.filter(student=student, is_completed=True)
        .select_related("course", "course__category")
        .order_by("-updated_at")
    )
    return [
        {
            "id": progress.id,
            "course": {
                "id": progress.course_id,
                "title": progress.course.title,
                "code": progress.course.code,
                "category": progress.course.category.name
                if progress.course.category_id
                else None,
            },
            "completion_percentage": float(progress.completion_percentage),
            "completed_at": progress.updated_at,
        }
        for progress in completed
    ]
