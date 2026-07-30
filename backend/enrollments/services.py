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
