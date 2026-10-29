"""Shared fixtures — a course with one teacher and one enrolled student."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from ..models import ClassSession

UserModel = get_user_model()


def make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        name=username.title(),
        role=role,
        gender=UserModel.Gender.MALE,
    )


def make_course(code="NIL-101", title="Name, Image, Likeness"):
    category, _ = Category.objects.get_or_create(name="Athlete Business")
    return Course.objects.create(title=title, code=code, category=category)


def assign_teacher(course, teacher):
    return CourseInstructor.objects.create(course=course, instructor=teacher, is_lead=True)


def enrol(course, student, status=Enrollment.EnrollmentStatus.ACTIVE):
    return Enrollment.objects.create(course=course, student=student, status=status)


def make_session(*, course, teacher, starts_in_minutes=60, duration=60, **kwargs):
    kwargs.setdefault("title", "Film Review: Week 4")
    return ClassSession.objects.create(
        course=course,
        teacher=teacher,
        scheduled_at=timezone.now() + timedelta(minutes=starts_in_minutes),
        duration_minutes=duration,
        **kwargs,
    )
