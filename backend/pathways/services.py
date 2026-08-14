from decimal import Decimal

from django.db import IntegrityError, transaction

from common.models import Status
from enrollments.models import Enrollment
from enrollments.services import assign_teacher_for_course

from .models import Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment


class PathwayReorderError(Exception):
    pass


def compute_bundle_total(pathways):
    """Sums base_price across pathways and applies the matching PathwayBundleRule
    discount (by pathway count), if one exists. Returns (total, discount_percent)."""
    base_total = sum((pathway.base_price for pathway in pathways), Decimal("0"))
    rule = PathwayBundleRule.objects.filter(pathway_count=len(pathways)).first()
    discount_percent = rule.discount_percent if rule else Decimal("0")
    total = base_total * (Decimal("1") - discount_percent / Decimal("100"))
    return total.quantize(Decimal("0.01")), discount_percent


def _enroll_user_in_pathway_courses(user, pathway):
    """Grants real course Enrollments for every published course in the pathway.

    Idempotent — safe to call for an already-purchased pathway (e.g. a course was
    attached after purchase) since it only creates enrollments that don't exist yet.
    """
    courses = [
        pc.course
        for pc in PathwayCourse.objects.filter(pathway=pathway, course__status=Status.PUBLISHED)
        .select_related("course")
    ]

    courses_without_instructor = []
    for course in courses:
        if Enrollment.objects.filter(student=user, course=course).exists():
            continue

        teacher = assign_teacher_for_course(course)
        if teacher is None:
            courses_without_instructor.append(course.title)
            continue

        try:
            Enrollment.objects.create(student=user, course=course, teacher=teacher)
        except IntegrityError:
            # Lost a race to a duplicate enrollment created in the same instant.
            continue

    return courses_without_instructor


def checkout_pathways(user, pathway_ids):
    """Dummy-payment checkout for one or more pathways (mirrors carts.services.checkout_cart).

    Each pathway is handled independently — one already-owned or invalid pathway
    doesn't block the rest of the purchase. Bundle discount (by count of *valid*
    pathways in this single checkout) is applied per-pathway to `price_paid`, so
    the sum of price_paid across the batch always equals the discounted total.
    """
    pathways = list(
        Pathway.objects.filter(id__in=pathway_ids, status=Status.PUBLISHED)
    )
    found_ids = {pathway.id for pathway in pathways}

    enrolled_pathways = []
    already_enrolled_pathways = []
    failed_pathways = []

    for pathway_id in pathway_ids:
        if pathway_id not in found_ids:
            failed_pathways.append(
                {"pathway_id": pathway_id, "reason": "This pathway is not available for purchase."}
            )

    if pathways:
        total, discount_percent = compute_bundle_total(pathways)

    for pathway in pathways:
        discounted_price = (pathway.base_price * (1 - discount_percent / Decimal("100"))).quantize(
            Decimal("0.01")
        )

        existing = PathwayEnrollment.objects.filter(user=user, pathway=pathway).first()
        if existing is not None:
            _enroll_user_in_pathway_courses(user, pathway)
            already_enrolled_pathways.append({"pathway_id": pathway.id, "pathway_name": pathway.name})
            continue

        with transaction.atomic():
            try:
                enrollment = PathwayEnrollment.objects.create(
                    user=user, pathway=pathway, price_paid=discounted_price
                )
            except IntegrityError:
                already_enrolled_pathways.append(
                    {"pathway_id": pathway.id, "pathway_name": pathway.name}
                )
                continue

            courses_without_instructor = _enroll_user_in_pathway_courses(user, pathway)

        enrolled_pathways.append(
            {
                "pathway_id": pathway.id,
                "pathway_name": pathway.name,
                "pathway_enrollment_id": enrollment.id,
                "price_paid": str(discounted_price),
                "courses_without_instructor": courses_without_instructor,
            }
        )

    return {
        "enrolled_pathways": enrolled_pathways,
        "already_enrolled_pathways": already_enrolled_pathways,
        "failed_pathways": failed_pathways,
    }


def reorder_pathway_courses(pathway_id, entries):
    pathwaycourse_ids = [entry["pathwaycourse_id"] for entry in entries]

    if len(pathwaycourse_ids) != len(set(pathwaycourse_ids)):
        raise PathwayReorderError("Duplicate pathway course ids are not allowed.")

    orders = [entry["order"] for entry in entries]
    if len(orders) != len(set(orders)):
        raise PathwayReorderError("Duplicate order values are not allowed.")

    existing_ids = set(
        PathwayCourse.objects.filter(pathway_id=pathway_id).values_list("id", flat=True)
    )
    if set(pathwaycourse_ids) != existing_ids:
        raise PathwayReorderError(
            "Submitted ids must exactly match the courses attached to this pathway."
        )

    # Staged through a temporary offset range — (pathway, order) is a non-deferrable
    # partial unique index, same reasoning as assignments.services.reorder_assignments.
    temp_offset = max(orders) + 1
    with transaction.atomic():
        for index, entry in enumerate(entries):
            PathwayCourse.objects.filter(pk=entry["pathwaycourse_id"], pathway_id=pathway_id).update(
                order=temp_offset + index
            )
        for entry in entries:
            PathwayCourse.objects.filter(pk=entry["pathwaycourse_id"], pathway_id=pathway_id).update(
                order=entry["order"]
            )

    return (
        PathwayCourse.objects.select_related("course")
        .filter(pathway_id=pathway_id)
        .order_by("order")
    )
