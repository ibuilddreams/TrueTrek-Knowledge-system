from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Avg, Count, Max, Q
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from common.import_files import (
    ImportFileError,
    build_sample_csv,
    build_sample_workbook,
    parse_tabular_file,
)
from courses.models import Course
from courses.serializers import CourseListSerializer
from enrollments.models import Enrollment
from enrollments.serializers import CourseEnrolledStudentSerializer
from progress.models import CourseProgress, LearningActivity
from quizzes.models import QuizResult

from .serializers import StudentSerializer

UserModel = get_user_model()


class DuplicateRecordError(Exception):
    """Raised when an imported row matches an existing user (or an earlier row in the same file)."""

STUDENT_IMPORT_HEADERS = [
    "First Name",
    "Last Name",
    "Email",
    "Username",
    "Password",
    "Gender",
]

TEACHER_IMPORT_HEADERS = [
    "First Name",
    "Last Name",
    "Email",
    "Username",
    "Password",
    "Gender",
]

STUDENT_SAMPLE_ROWS = [
    {
        "First Name": "John",
        "Last Name": "Doe",
        "Email": "john@example.com",
        "Username": "john.doe",
        "Password": "Password123",
        "Gender": "Male",
    },
    {
        "First Name": "Jane",
        "Last Name": "Smith",
        "Email": "jane@example.com",
        "Username": "jane.smith",
        "Password": "Password123",
        "Gender": "Female",
    },
]

TEACHER_SAMPLE_ROWS = [
    {
        "First Name": "Alex",
        "Last Name": "Morgan",
        "Email": "alex.morgan@example.com",
        "Username": "alex.morgan",
        "Password": "Password123",
        "Gender": "Male",
    },
    {
        "First Name": "Sam",
        "Last Name": "Lee",
        "Email": "sam.lee@example.com",
        "Username": "sam.lee",
        "Password": "Password123",
        "Gender": "Female",
    },
]

GENDER_ALIASES = {
    "male": UserModel.Gender.MALE,
    "m": UserModel.Gender.MALE,
    "female": UserModel.Gender.FEMALE,
    "f": UserModel.Gender.FEMALE,
    "other": UserModel.Gender.OTHER,
    "o": UserModel.Gender.OTHER,
}


def send_password_reset_email(email):
    user = UserModel.objects.filter(email__iexact=email).first()
    if user is None:
        return

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    send_mail(
        subject="Reset your TrueTrek Learning password",
        message=(
            "We received a request to reset your TrueTrek Learning password.\n\n"
            f"Reset your password using the link below:\n{reset_link}\n\n"
            "If you didn't request this, you can safely ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def get_teacher_assigned_courses(teacher):
    return (
        Course.objects.filter(instructors__instructor=teacher)
        .annotate(
            total_students=Count(
                "enrollments", filter=Q(enrollments__teacher=teacher), distinct=True
            ),
            modules_count=Count("modules", distinct=True),
            lessons_count=Count("modules__lessons", distinct=True),
            assignments_count=Count("assignments", distinct=True),
            quizzes_count=Count("quizzes", distinct=True),
        )
        .select_related("category")
        .prefetch_related("tags", "instructors__instructor")
    )


def get_teacher_assigned_courses_with_students(teacher):
    courses = Course.objects.filter(instructors__instructor=teacher)

    courses_data = []
    for course in courses:
        enrollments = Enrollment.objects.filter(course=course, teacher=teacher).select_related(
            "student"
        )
        courses_data.append(
            {
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "status": course.status,
                "total_students": enrollments.count(),
                "students": CourseEnrolledStudentSerializer(enrollments, many=True).data,
            }
        )

    return courses_data


def get_teacher_enrolled_student_detail(teacher, student_id):
    enrollments = (
        Enrollment.objects.filter(student_id=student_id, teacher=teacher)
        .select_related("student", "course", "course__category")
        .prefetch_related("course__tags", "course__instructors__instructor")
    )

    if not enrollments.exists():
        return None

    student = enrollments[0].student
    course_ids = [enrollment.course_id for enrollment in enrollments]
    progress_by_course_id = {
        progress.course_id: progress
        for progress in CourseProgress.objects.filter(student_id=student_id, course_id__in=course_ids)
    }

    courses_data = []
    for enrollment in enrollments:
        progress = progress_by_course_id.get(enrollment.course_id)
        courses_data.append(
            {
                "course": CourseListSerializer(enrollment.course).data,
                "status": enrollment.status,
                "enrolled_at": enrollment.enrolled_at,
                "completion_percentage": progress.completion_percentage if progress else 0,
                "is_completed": progress.is_completed if progress else False,
            }
        )

    return {
        "student": StudentSerializer(student).data,
        "total_courses": len(courses_data),
        "courses": courses_data,
    }


def get_teacher_enrolled_students_roster(teacher):
    enrollments = (
        Enrollment.objects.filter(teacher=teacher)
        .select_related("student", "course")
        .order_by("student__first_name", "student__last_name", "-enrolled_at")
    )
    taught_course_ids = list({enrollment.course_id for enrollment in enrollments})

    student_ids = list({enrollment.student_id for enrollment in enrollments})

    progress_by_student = {
        row["student_id"]: row["avg_progress"] or 0
        for row in CourseProgress.objects.filter(
            student_id__in=student_ids, course_id__in=taught_course_ids
        )
        .values("student_id")
        .annotate(avg_progress=Avg("completion_percentage"))
    }

    quiz_by_student = {
        row["attempt__student_id"]: row["avg_score"] or 0
        for row in QuizResult.objects.filter(
            attempt__student_id__in=student_ids,
            attempt__quiz__course_id__in=taught_course_ids,
        )
        .values("attempt__student_id")
        .annotate(avg_score=Avg("percentage"))
    }

    last_activity_by_student = {
        row["student_id"]: row["last_activity"]
        for row in LearningActivity.objects.filter(
            student_id__in=student_ids, course_id__in=taught_course_ids
        )
        .values("student_id")
        .annotate(last_activity=Max("created_at"))
    }

    students_map = {}
    for enrollment in enrollments:
        student = enrollment.student
        entry = students_map.get(student.id)
        if entry is None:
            entry = {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "account_status": student.account_status,
                "courses": [],
                "enrolled_at": enrollment.enrolled_at,
            }
            students_map[student.id] = entry

        entry["courses"].append(
            {
                "id": enrollment.course_id,
                "title": enrollment.course.title,
                "status": enrollment.status,
                "enrolled_at": enrollment.enrolled_at,
            }
        )
        if enrollment.enrolled_at and (
            entry["enrolled_at"] is None or enrollment.enrolled_at < entry["enrolled_at"]
        ):
            entry["enrolled_at"] = enrollment.enrolled_at

    status_priority = {
        Enrollment.EnrollmentStatus.ACTIVE: 0,
        Enrollment.EnrollmentStatus.COMPLETED: 1,
        Enrollment.EnrollmentStatus.SUSPENDED: 2,
        Enrollment.EnrollmentStatus.CANCELLED: 3,
    }

    roster = []
    for student_id, entry in students_map.items():
        courses = entry["courses"]
        primary_status = sorted(
            courses, key=lambda course: status_priority.get(course["status"], 99)
        )[0]["status"]
        average_progress = round(float(progress_by_student.get(student_id, 0)), 2)
        average_score = round(float(quiz_by_student.get(student_id, 0)), 2)
        last_activity_at = last_activity_by_student.get(student_id)

        roster.append(
            {
                "id": entry["id"],
                "name": entry["name"],
                "email": entry["email"],
                "account_status": entry["account_status"],
                "status": primary_status,
                "courses_count": len(courses),
                "courses": courses,
                "enrolled_at": entry["enrolled_at"],
                "average_progress": average_progress,
                "average_score": average_score,
                "last_activity_at": last_activity_at,
            }
        )

    roster.sort(key=lambda item: (item["name"] or "").lower())
    return roster


def _normalize_gender(value):
    key = str(value or "").strip().lower()
    return GENDER_ALIASES.get(key)


def _create_imported_student(row_data, seen_emails, seen_usernames):
    first_name = row_data.get("First Name", "").strip()
    last_name = row_data.get("Last Name", "").strip()
    email = UserModel.objects.normalize_email(row_data.get("Email", "").strip())
    username = row_data.get("Username", "").strip()
    password = row_data.get("Password", "")
    gender = _normalize_gender(row_data.get("Gender", ""))

    if not first_name:
        raise ValueError("First Name is required.")
    if not last_name:
        raise ValueError("Last Name is required.")
    if not email:
        raise ValueError("Email is required.")
    if not username:
        raise ValueError("Username is required.")
    if not password:
        raise ValueError("Password is required.")
    if gender is None:
        raise ValueError("Gender must be Male, Female, or Other.")

    email_key = email.lower()
    username_key = username.lower()

    if email_key in seen_emails or username_key in seen_usernames:
        raise DuplicateRecordError("Duplicate email or username within the uploaded file.")

    if (
        UserModel.objects.filter(email__iexact=email).exists()
        or UserModel.objects.filter(username__iexact=username).exists()
    ):
        raise DuplicateRecordError("Student already exists.")

    with transaction.atomic():
        user = UserModel.objects.create_user(
            email=email,
            password=password,
            username=username,
            first_name=first_name,
            last_name=last_name,
            gender=gender,
            role=UserModel.Roles.STUDENT,
        )

    seen_emails.add(email_key)
    seen_usernames.add(username_key)

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.name,
        "email": user.email,
        "gender": user.gender,
        "role": user.role,
    }


def _create_imported_teacher(row_data, seen_emails, seen_usernames):
    first_name = row_data.get("First Name", "").strip()
    last_name = row_data.get("Last Name", "").strip()
    email = UserModel.objects.normalize_email(row_data.get("Email", "").strip())
    username = row_data.get("Username", "").strip()
    password = row_data.get("Password", "")
    gender = _normalize_gender(row_data.get("Gender", ""))

    if not first_name:
        raise ValueError("First Name is required.")
    if not last_name:
        raise ValueError("Last Name is required.")
    if not email:
        raise ValueError("Email is required.")
    if not username:
        raise ValueError("Username is required.")
    if not password:
        raise ValueError("Password is required.")
    if gender is None:
        raise ValueError("Gender must be Male, Female, or Other.")

    email_key = email.lower()
    username_key = username.lower()

    if email_key in seen_emails or username_key in seen_usernames:
        raise DuplicateRecordError("Duplicate email or username within the uploaded file.")

    if (
        UserModel.objects.filter(email__iexact=email).exists()
        or UserModel.objects.filter(username__iexact=username).exists()
    ):
        raise DuplicateRecordError("Teacher already exists.")

    with transaction.atomic():
        user = UserModel.objects.create_user(
            email=email,
            password=password,
            username=username,
            first_name=first_name,
            last_name=last_name,
            gender=gender,
            role=UserModel.Roles.TEACHER,
        )

    seen_emails.add(email_key)
    seen_usernames.add(username_key)

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.name,
        "email": user.email,
        "gender": user.gender,
        "role": user.role,
    }


def bulk_import_students(uploaded_file):
    rows = parse_tabular_file(uploaded_file, STUDENT_IMPORT_HEADERS)

    created = []
    skipped = []
    errors = []
    seen_emails = set()
    seen_usernames = set()

    for entry in rows:
        row_number = entry["row_number"]
        row_data = entry["data"]
        row_identity = {
            "email": row_data.get("Email", ""),
            "username": row_data.get("Username", ""),
            "first_name": row_data.get("First Name", ""),
            "last_name": row_data.get("Last Name", ""),
        }
        try:
            created.append(_create_imported_student(row_data, seen_emails, seen_usernames))
        except DuplicateRecordError as exc:
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


def get_student_import_sample(file_format):
    format_key = (file_format or "csv").lower()
    if format_key == "xlsx":
        return (
            build_sample_workbook(STUDENT_IMPORT_HEADERS, STUDENT_SAMPLE_ROWS),
            "student_import_sample.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    if format_key == "csv":
        return (
            build_sample_csv(STUDENT_IMPORT_HEADERS, STUDENT_SAMPLE_ROWS),
            "student_import_sample.csv",
            "text/csv",
        )
    raise ImportFileError("Sample format must be csv or xlsx.")


def bulk_import_teachers(uploaded_file):
    rows = parse_tabular_file(uploaded_file, TEACHER_IMPORT_HEADERS)

    created = []
    skipped = []
    errors = []
    seen_emails = set()
    seen_usernames = set()

    for entry in rows:
        row_number = entry["row_number"]
        row_data = entry["data"]
        row_identity = {
            "email": row_data.get("Email", ""),
            "username": row_data.get("Username", ""),
            "first_name": row_data.get("First Name", ""),
            "last_name": row_data.get("Last Name", ""),
        }
        try:
            created.append(_create_imported_teacher(row_data, seen_emails, seen_usernames))
        except DuplicateRecordError as exc:
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


def get_teacher_import_sample(file_format):
    format_key = (file_format or "csv").lower()
    if format_key == "xlsx":
        return (
            build_sample_workbook(TEACHER_IMPORT_HEADERS, TEACHER_SAMPLE_ROWS),
            "teacher_import_sample.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    if format_key == "csv":
        return (
            build_sample_csv(TEACHER_IMPORT_HEADERS, TEACHER_SAMPLE_ROWS),
            "teacher_import_sample.csv",
            "text/csv",
        )
    raise ImportFileError("Sample format must be csv or xlsx.")
