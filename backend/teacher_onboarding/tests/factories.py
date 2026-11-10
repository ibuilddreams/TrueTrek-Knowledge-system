import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.test import override_settings

from teacher_onboarding.models import TeacherOnboarding
from teacher_onboarding.services import (
    MIN_BIO_LENGTH,
    MIN_TEACHING_STATEMENT_LENGTH,
)

UserModel = get_user_model()

PASSWORD = "StrongPass123!"

BIO = "I have taught secondary mathematics for a decade. " * 4
TEACHING_STATEMENT = "I teach by starting from what a student already knows. " * 4

assert len(BIO) >= MIN_BIO_LENGTH
assert len(TEACHING_STATEMENT) >= MIN_TEACHING_STATEMENT_LENGTH


def make_user(role, *, email, username=None, **extra):
    return UserModel.objects.create_user(
        username=username or email.split("@")[0],
        email=email,
        password=PASSWORD,
        first_name=extra.pop("first_name", "Test"),
        last_name=extra.pop("last_name", "User"),
        gender=UserModel.Gender.OTHER,
        role=role,
        **extra,
    )


def make_admin(email="admin@example.com", **extra):
    return make_user(UserModel.Roles.ADMIN, email=email, **extra)


def make_teacher(email="teacher@example.com", **extra):
    return make_user(UserModel.Roles.TEACHER, email=email, **extra)


def make_student(email="student@example.com", **extra):
    return make_user(UserModel.Roles.STUDENT, email=email, **extra)


def fill_profile(onboarding, **overrides):
    """Everything an application needs except the uploads."""
    fields = {
        "headline": "Secondary mathematics teacher",
        "bio": BIO,
        "highest_qualification": TeacherOnboarding.Qualification.MASTERS,
        "years_of_experience": 10,
        "expertise": ["Algebra", "Calculus"],
        "teaching_statement": TEACHING_STATEMENT,
    }
    fields.update(overrides)
    for field, value in fields.items():
        setattr(onboarding, field, value)
    onboarding.save()
    return onboarding


class TempMediaMixin:
    """Points MEDIA_ROOT at a throwaway directory for the duration of a test.

    These tests upload real files, and without this every run leaves
    certificates and videos behind in the developer's own `media/` — the
    convention `instructors/tests/test_views.py` already set.
    """

    def setUp(self):
        super().setUp()
        media_root = tempfile.mkdtemp()
        override = override_settings(MEDIA_ROOT=media_root)
        override.enable()
        self.addCleanup(override.disable)
        self.addCleanup(shutil.rmtree, media_root, ignore_errors=True)
