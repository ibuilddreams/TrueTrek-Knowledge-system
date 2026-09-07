from django.contrib.auth import get_user_model
from django.db import transaction

from notifications.services import create_notifications_for_users

from .models import StudentConcern

UserModel = get_user_model()


def flag_student_concern(teacher, *, student, course, category, description, requires_admin_attention):
    """Creates the StudentConcern row and, if it requires admin attention,
    fans out one Notification to every active admin — atomically, so a
    concern can never exist without the escalation it was flagged for."""
    with transaction.atomic():
        concern = StudentConcern.objects.create(
            teacher=teacher,
            student=student,
            course=course,
            category=category,
            description=description,
            requires_admin_attention=requires_admin_attention,
        )
        if requires_admin_attention:
            _notify_admins_of_concern(concern)
    return concern


def _notify_admins_of_concern(concern):
    admin_ids = UserModel.objects.filter(
        role=UserModel.Roles.ADMIN, account_status=UserModel.AccountStatus.ACTIVE
    ).values_list("id", flat=True)

    create_notifications_for_users(
        admin_ids,
        verb="STUDENT_CONCERN_FLAGGED",
        title=f"Concern flagged for {concern.student.name}",
        message=(
            f"{concern.teacher.name} flagged a {concern.get_category_display().lower()} "
            f"concern about {concern.student.name}."
        ),
        related_object_type="student_concern",
        related_object_id=concern.id,
    )
