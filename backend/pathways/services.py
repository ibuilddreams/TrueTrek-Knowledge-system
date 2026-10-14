from decimal import Decimal
from uuid import uuid4

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils.text import slugify

from common.models import Status
from courses.models import Course
from enrollments.models import Enrollment
from enrollments.services import assign_teacher_for_course

from .models import Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment

# A student-built bundle needs at least two courses to be a bundle at all, and
# the upper bound keeps one checkout (and its enrollment fan-out) bounded.
MIN_CUSTOM_PATHWAY_COURSES = 2
MAX_CUSTOM_PATHWAY_COURSES = 20


class PathwayReorderError(Exception):
    pass


class CustomPathwayError(Exception):
    """A custom pathway couldn't be built/changed as asked (surfaced as a 400)."""


def catalog_pathways():
    """The admin-authored pathways — everything except students' own bundles.

    Every catalog surface (public list, admin list, tier attach, onboarding
    recommendations) reads through this so a custom pathway can never leak
    into a list it doesn't belong in.
    """
    return Pathway.objects.filter(is_custom=False)


def visible_pathway_filter(user):
    """Q for "pathways this viewer may open": the catalog, plus their own bundles."""
    if user is not None and user.is_authenticated:
        return Q(is_custom=False) | Q(created_by=user)
    return Q(is_custom=False)


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
    # A custom pathway is only purchasable by the student who built it — ids
    # are guessable, and someone else's bundle is not a product.
    pathways = list(
        Pathway.objects.filter(id__in=pathway_ids, status=Status.PUBLISHED).filter(
            visible_pathway_filter(user)
        )
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

        # A custom pathway's price is the sum of its courses, snapshotted when
        # the student built it. If one of them has since been unpublished, that
        # price no longer matches what they'd actually get — so the purchase is
        # refused until they edit the bundle (which reprices it).
        if pathway.is_custom and (
            PathwayCourse.objects.filter(pathway=pathway)
            .exclude(course__status=Status.PUBLISHED)
            .exists()
        ):
            failed_pathways.append(
                {
                    "pathway_id": pathway.id,
                    "reason": (
                        f'"{pathway.name}" contains a course that is no longer available. '
                        "Edit the pathway to remove it, then try again."
                    ),
                }
            )
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


def _generate_custom_pathway_slug(name):
    """A unique slug for a student-built pathway.

    Always suffixed, so a bundle called "My Pathway" never takes the clean
    slug an admin-authored pathway of the same name would want.
    """
    base = (slugify(name) or "pathway")[:200]
    for _ in range(5):
        slug = f"{base}-{uuid4().hex[:8]}"
        if not Pathway.objects.filter(slug=slug).exists():
            return slug
    raise CustomPathwayError("Couldn't generate a unique pathway link. Please try again.")


def _resolve_custom_pathway_courses(user, course_ids):
    """Validates the selected course ids and returns the Course rows in order.

    Rejects anything the student shouldn't be paying for: unpublished/removed
    courses, and courses they're already enrolled in.
    """
    if len(course_ids) != len(set(course_ids)):
        raise CustomPathwayError("Duplicate courses are not allowed.")

    courses_by_id = {
        course.id: course
        for course in Course.objects.filter(id__in=course_ids, status=Status.PUBLISHED)
    }
    if len(courses_by_id) != len(course_ids):
        raise CustomPathwayError("Some of the selected courses are no longer available.")

    already_enrolled = list(
        Enrollment.objects.filter(student=user, course_id__in=course_ids).values_list(
            "course__title", flat=True
        )
    )
    if already_enrolled:
        raise CustomPathwayError(
            "You're already enrolled in "
            f"{', '.join(already_enrolled)}. Remove it from your pathway to continue."
        )

    # Selection order is the order the student picked them in — it becomes the
    # pathway's course order, same as an admin's manual ordering.
    return [courses_by_id[course_id] for course_id in course_ids]


def _custom_pathway_price(courses):
    return sum((course.amount for course in courses), Decimal("0")).quantize(Decimal("0.01"))


def _write_custom_pathway_courses(pathway, courses):
    """Replaces the pathway's course list, keeping selection order as `order`."""
    PathwayCourse.objects.filter(pathway=pathway).delete()
    PathwayCourse.objects.bulk_create(
        [
            PathwayCourse(pathway=pathway, course=course, order=index)
            for index, course in enumerate(courses, start=1)
        ]
    )


def is_custom_pathway_purchased(pathway):
    return PathwayEnrollment.objects.filter(pathway=pathway).exists()


def create_custom_pathway(user, name, summary, course_ids):
    """Builds a student-owned pathway from the courses they picked.

    Priced as the plain sum of the courses' amounts — a bundle discount, if one
    is ever wanted here, belongs in a rule rather than hard-coded.
    """
    courses = _resolve_custom_pathway_courses(user, course_ids)

    with transaction.atomic():
        pathway = Pathway.objects.create(
            name=name,
            slug=_generate_custom_pathway_slug(name),
            summary=summary,
            # PUBLISHED is what makes the pathway purchasable through the
            # shared checkout; `is_custom` is what keeps it out of the catalog.
            status=Status.PUBLISHED,
            base_price=_custom_pathway_price(courses),
            is_custom=True,
            created_by=user,
        )
        _write_custom_pathway_courses(pathway, courses)

    return pathway


def update_custom_pathway(user, pathway, name=None, summary=None, course_ids=None):
    """Renames a custom pathway and/or swaps the courses inside it.

    Locked once purchased — the bundle is then an entitlement record, and its
    price/contents have to keep matching what was actually paid for.
    """
    if is_custom_pathway_purchased(pathway):
        raise CustomPathwayError("This pathway has already been purchased and can't be changed.")

    courses = None
    if course_ids is not None:
        courses = _resolve_custom_pathway_courses(user, course_ids)

    with transaction.atomic():
        if name is not None:
            pathway.name = name
        if summary is not None:
            pathway.summary = summary
        if courses is not None:
            pathway.base_price = _custom_pathway_price(courses)
        pathway.save()
        if courses is not None:
            _write_custom_pathway_courses(pathway, courses)

    return pathway


def delete_custom_pathway(pathway):
    if is_custom_pathway_purchased(pathway):
        raise CustomPathwayError("This pathway has already been purchased and can't be deleted.")
    pathway.delete()
