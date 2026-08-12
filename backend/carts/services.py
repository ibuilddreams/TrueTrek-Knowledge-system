from django.db import IntegrityError, transaction

from common.models import Status
from enrollments.models import Enrollment
from enrollments.services import assign_teacher_for_course

from .models import CartItem


def checkout_cart(student):
    """Processes every course currently in the student's cart as a purchase.

    Each course is handled independently and atomically — a course is either
    fully enrolled (Enrollment created + cart item removed) or left untouched,
    never a partial state. One course failing (no instructor yet, no longer
    published) doesn't block the rest of the cart from checking out.
    """
    cart_items = list(CartItem.objects.filter(user=student).select_related("course"))

    enrolled = []
    already_enrolled = []
    failed = []

    for item in cart_items:
        course = item.course

        if course.status != Status.PUBLISHED:
            failed.append(
                {
                    "course_id": course.id,
                    "course_title": course.title,
                    "reason": "This course is no longer available for purchase.",
                }
            )
            continue

        if Enrollment.objects.filter(student=student, course=course).exists():
            item.delete()
            already_enrolled.append({"course_id": course.id, "course_title": course.title})
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

        try:
            with transaction.atomic():
                enrollment = Enrollment.objects.create(
                    student=student, course=course, teacher=teacher
                )
                item.delete()
        except IntegrityError:
            # Lost a race to a duplicate enrollment created in the same instant
            # (e.g. a second checkout request) — the desired end state (enrolled,
            # no longer in the cart) already holds, so treat it as such.
            item.delete()
            already_enrolled.append({"course_id": course.id, "course_title": course.title})
            continue

        enrolled.append(
            {
                "course_id": course.id,
                "course_title": course.title,
                "enrollment_id": enrollment.id,
                "teacher": {"id": teacher.id, "name": teacher.name},
            }
        )

    return {"enrolled": enrolled, "already_enrolled": already_enrolled, "failed": failed}
