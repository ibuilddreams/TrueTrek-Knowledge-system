from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count
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
from progress.models import CourseProgress

from .models import UserProfile
from .serializers import StudentSerializer

UserModel = get_user_model()

STUDENT_IMPORT_HEADERS = [
    "First Name",
    "Last Name",
    "Email",
    "Password",
    "Phone",
    "Gender",
]

STUDENT_SAMPLE_ROWS = [
    {
        "First Name": "John",
        "Last Name": "Doe",
        "Email": "john@example.com",
        "Password": "Password123",
        "Phone": "+1234567890",
        "Gender": "Male",
    },
    {
        "First Name": "Jane",
        "Last Name": "Smith",
        "Email": "jane@example.com",
        "Password": "Password123",
        "Phone": "+1234567891",
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
        .annotate(total_students=Count("enrollments", distinct=True))
        .select_related("category")
        .prefetch_related("tags", "instructors__instructor")
    )


def get_teacher_assigned_courses_with_students(teacher):
    courses = Course.objects.filter(instructors__instructor=teacher)

    courses_data = []
    for course in courses:
        enrollments = Enrollment.objects.filter(course=course).select_related("student")
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
        Enrollment.objects.filter(student_id=student_id, course__instructors__instructor=teacher)
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


def _normalize_gender(value):
    key = str(value or "").strip().lower()
    return GENDER_ALIASES.get(key)


def _unique_username_from_email(email):
    local_part = email.split("@", 1)[0].strip().lower()
    base = "".join(char if char.isalnum() or char in "._-" else "_" for char in local_part) or "student"
    base = base[:120]
    candidate = base
    suffix = 1
    while UserModel.objects.filter(username__iexact=candidate).exists():
        suffix_text = str(suffix)
        candidate = f"{base[: 150 - len(suffix_text) - 1]}_{suffix_text}"
        suffix += 1
    return candidate


def _create_imported_student(row_data):
    first_name = row_data.get("First Name", "").strip()
    last_name = row_data.get("Last Name", "").strip()
    email = UserModel.objects.normalize_email(row_data.get("Email", "").strip())
    password = row_data.get("Password", "")
    phone = row_data.get("Phone", "").strip()
    gender = _normalize_gender(row_data.get("Gender", ""))

    if not first_name:
        raise ValueError("First Name is required.")
    if not last_name:
        raise ValueError("Last Name is required.")
    if not email:
        raise ValueError("Email is required.")
    if not password:
        raise ValueError("Password is required.")
    if gender is None:
        raise ValueError("Gender must be Male, Female, or Other.")

    if UserModel.objects.filter(email__iexact=email).exists():
        raise ValueError("A user with this email already exists.")

    try:
        validate_password(password)
    except DjangoValidationError as exc:
        raise ValueError(" ".join(exc.messages)) from exc

    username = _unique_username_from_email(email)

    with transaction.atomic():
        student = UserModel.objects.create_user(
            email=email,
            password=password,
            username=username,
            first_name=first_name,
            last_name=last_name,
            gender=gender,
            role=UserModel.Roles.STUDENT,
        )
        if phone:
            UserProfile.objects.update_or_create(
                user=student,
                defaults={"phone_number": phone},
            )

    return {
        "id": student.id,
        "username": student.username,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "full_name": student.name,
        "email": student.email,
        "gender": student.gender,
        "phone": phone,
        "role": student.role,
    }


def bulk_import_students(uploaded_file):
    rows = parse_tabular_file(uploaded_file, STUDENT_IMPORT_HEADERS)

    created = []
    errors = []

    for entry in rows:
        row_number = entry["row_number"]
        row_data = entry["data"]
        try:
            created.append(_create_imported_student(row_data))
        except Exception as exc:
            errors.append(
                {
                    "row": row_number,
                    "error": str(exc),
                    "data": {
                        "email": row_data.get("Email", ""),
                        "first_name": row_data.get("First Name", ""),
                        "last_name": row_data.get("Last Name", ""),
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
