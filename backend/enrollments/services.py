from django.contrib.auth import get_user_model
from django.db import transaction

from assignments.models import AssignmentSubmission
from common.import_files import (
    ImportFileError,
    build_sample_csv,
    build_sample_workbook,
    parse_tabular_file,
)
from common.models import Status
from courses.models import Course, CourseInstructor
from courses.serializers import CourseDetailSerializer
from lessons.models import Lesson
from progress.models import CourseProgress, LearningActivity, LessonProgress, ModuleProgress
from quizzes.models import Quiz, QuizAttempt

from .models import Enrollment
from .serializers import EnrollmentTeacherSerializer

UserModel = get_user_model()


class DuplicateEnrollmentError(Exception):
    """Raised when an imported row matches an enrollment that already exists."""


ENROLLMENT_IMPORT_HEADERS = ["Student Email"]
ENROLLMENT_COURSE_HEADERS = ["Course Code", "Course Title"]
ENROLLMENT_TEACHER_HEADERS = ["Teacher Email"]

ENROLLMENT_SAMPLE_ROWS = [
    {"Student Email": "john@example.com", "Course Code": "CS101", "Teacher Email": ""},
    {
        "Student Email": "jane@example.com",
        "Course Code": "MATH201",
        "Teacher Email": "teacher@example.com",
    },
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


def _resolve_teacher_for_enrollment(course, teacher_email):
    """Resolves which instructor to enroll the student under.

    A course can have multiple assigned instructors, so an explicit Teacher Email
    is required to disambiguate. When the course has exactly one instructor, that
    instructor is used automatically so single-instructor courses don't need the
    column filled in.
    """
    teacher_email = (teacher_email or "").strip()

    if teacher_email:
        email = UserModel.objects.normalize_email(teacher_email)
        teacher = UserModel.objects.filter(
            email__iexact=email, role=UserModel.Roles.TEACHER
        ).first()
        if teacher is None:
            raise ValueError(f"No teacher found with email '{email}'.")
        if not CourseInstructor.objects.filter(course=course, instructor=teacher).exists():
            raise ValueError("Selected teacher is not assigned to this course.")
        return teacher

    instructors = list(CourseInstructor.objects.filter(course=course).select_related("instructor"))
    if len(instructors) == 1:
        return instructors[0].instructor
    if not instructors:
        raise ValueError("This course has no assigned teacher. Provide a Teacher Email.")
    raise ValueError(
        "This course has multiple assigned teachers. Provide a Teacher Email to choose one."
    )


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
        raise DuplicateEnrollmentError("Student is already enrolled in this course.")

    teacher = _resolve_teacher_for_enrollment(course, row_data.get("Teacher Email", ""))

    with transaction.atomic():
        enrollment = Enrollment.objects.create(student=student, course=course, teacher=teacher)

    return {
        "id": enrollment.id,
        "student_email": student.email,
        "student_name": student.name,
        "course_id": course.id,
        "course_title": course.title,
        "course_code": course.code,
        "teacher_email": teacher.email,
        "teacher_name": teacher.name,
        "status": enrollment.status,
    }


def bulk_import_enrollments(uploaded_file):
    rows = parse_tabular_file(
        uploaded_file,
        ENROLLMENT_IMPORT_HEADERS,
        optional_headers=ENROLLMENT_COURSE_HEADERS + ENROLLMENT_TEACHER_HEADERS,
        require_one_of=ENROLLMENT_COURSE_HEADERS,
    )

    created = []
    skipped = []
    errors = []

    for entry in rows:
        row_number = entry["row_number"]
        row_data = entry["data"]
        row_identity = {
            "student_email": row_data.get("Student Email", ""),
            "course_code": row_data.get("Course Code", "") or row_data.get("Course Title", ""),
            "teacher_email": row_data.get("Teacher Email", ""),
        }
        try:
            created.append(_create_imported_enrollment(row_data))
        except DuplicateEnrollmentError as exc:
            skipped.append({"row": row_number, "reason": str(exc), **row_identity})
        except Exception as exc:
            errors.append({"row": row_number, "error": str(exc), "data": row_identity})

    return {
        "total_rows": len(rows),
        "success_count": len(created),
        "skipped_count": len(skipped),
        "failed_count": len(errors),
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }


def get_enrollment_import_sample(file_format):
    format_key = (file_format or "csv").lower()
    headers = ["Student Email", "Course Code", "Teacher Email"]
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
        .select_related("course", "course__category", "teacher", "teacher__profile")
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
            "teacher": (
                EnrollmentTeacherSerializer(
                    enrollment.teacher, context={"request": request}
                ).data
                if enrollment.teacher
                else None
            ),
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


def remove_enrollment(enrollment):
    """Permanently removes a student's enrollment from a course.

    Also deletes all of the student's data scoped to that course — lesson,
    module, and course progress; learning activity; quiz attempts (and their
    answers/results); and assignment submissions (and their files) — so no
    orphaned records are left behind. EnrollmentHistory rows cascade with the
    enrollment itself.
    """
    student = enrollment.student
    course = enrollment.course

    with transaction.atomic():
        LessonProgress.objects.filter(student=student, lesson__module__course=course).delete()
        ModuleProgress.objects.filter(student=student, module__course=course).delete()
        CourseProgress.objects.filter(student=student, course=course).delete()
        LearningActivity.objects.filter(student=student, course=course).delete()
        QuizAttempt.objects.filter(student=student, quiz__course=course).delete()
        AssignmentSubmission.objects.filter(student=student, assignment__course=course).delete()
        enrollment.delete()


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
