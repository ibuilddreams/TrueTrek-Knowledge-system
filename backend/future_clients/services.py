from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from common.models import Status
from enrollments.models import Enrollment
from enrollments.services import assign_teacher_for_course

from .models import ApplicationStatus, FutureClientApplication

UserModel = get_user_model()


class ApplicationApprovalError(Exception):
    """Raised when an application can't be approved or rejected as requested."""


def _generate_username(email):
    base = email.split("@")[0] or "student"
    username = base
    suffix = 1
    while UserModel.objects.filter(username__iexact=username).exists():
        suffix += 1
        username = f"{base}{suffix}"
    return username


def approve_application(application, admin_user):
    """Approves a pending application: creates the student account (reusing the
    applicant's originally chosen, already-hashed password) and enrolls them in
    every selected course that's still available.

    Locks the application row for the duration of the transaction so a
    double-click or two admins approving at once can't create duplicate
    students or enrollments — the second caller simply sees "already reviewed".
    Each selected course is handled independently (mirrors carts.checkout_cart):
    a course that's no longer published or has no instructor yet is skipped
    and reported back, it doesn't block the rest of the approval.
    """
    with transaction.atomic():
        application = FutureClientApplication.objects.select_for_update().get(
            pk=application.pk
        )

        if application.status != ApplicationStatus.PENDING:
            raise ApplicationApprovalError("This application has already been reviewed.")

        if UserModel.objects.filter(email__iexact=application.email).exists():
            raise ApplicationApprovalError("A user with this email already exists.")

        student = UserModel.objects.create_user(
            email=application.email,
            password=None,
            username=_generate_username(application.email),
            first_name=application.first_name,
            last_name=application.last_name,
            gender=UserModel.Gender.OTHER,
            role=UserModel.Roles.STUDENT,
        )
        student.password = application.password_hash
        student.save(update_fields=["password"])

        enrolled = []
        failed = []
        for course in application.courses.all():
            if course.status != Status.PUBLISHED:
                failed.append(
                    {
                        "course_id": course.id,
                        "course_title": course.title,
                        "reason": "This course is no longer available.",
                    }
                )
                continue

            teacher = assign_teacher_for_course(course)
            if teacher is None:
                failed.append(
                    {
                        "course_id": course.id,
                        "course_title": course.title,
                        "reason": "This course doesn't have an instructor assigned yet.",
                    }
                )
                continue

            enrollment = Enrollment.objects.create(student=student, course=course, teacher=teacher)
            enrolled.append(
                {
                    "course_id": course.id,
                    "course_title": course.title,
                    "enrollment_id": enrollment.id,
                    "teacher": {"id": teacher.id, "name": teacher.name},
                }
            )

        application.status = ApplicationStatus.APPROVED
        application.reviewed_at = timezone.now()
        application.reviewed_by = admin_user
        application.created_student = student
        application.save(
            update_fields=["status", "reviewed_at", "reviewed_by", "created_student", "updated_at"]
        )

    return {"student": student, "enrolled": enrolled, "failed": failed}


def reject_application(application, admin_user, reason):
    with transaction.atomic():
        application = FutureClientApplication.objects.select_for_update().get(
            pk=application.pk
        )

        if application.status != ApplicationStatus.PENDING:
            raise ApplicationApprovalError("This application has already been reviewed.")

        application.status = ApplicationStatus.REJECTED
        application.rejection_reason = reason
        application.reviewed_at = timezone.now()
        application.reviewed_by = admin_user
        application.save(
            update_fields=["status", "rejection_reason", "reviewed_at", "reviewed_by", "updated_at"]
        )

    return application
