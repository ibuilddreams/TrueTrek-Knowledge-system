from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from ..models import Audience, Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment

UserModel = get_user_model()


def make_user(email, role, **extra):
    return UserModel.objects.create_user(
        username=email.split("@")[0],
        email=email,
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
        **extra,
    )


class PathwayTestCase(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = make_user("teacher@example.com", UserModel.Roles.TEACHER)
        self.student = make_user("student@example.com", UserModel.Roles.STUDENT)

        self.category = Category.objects.create(name="Academics")
        self.course_a = Course.objects.create(
            title="Course A", code="CA101", category=self.category,
            status=Status.PUBLISHED, amount=100,
        )
        self.course_b = Course.objects.create(
            title="Course B", code="CB101", category=self.category,
            status=Status.PUBLISHED, amount=50,
        )
        CourseInstructor.objects.create(course=self.course_a, instructor=self.teacher, is_lead=True)
        CourseInstructor.objects.create(course=self.course_b, instructor=self.teacher, is_lead=True)

        self.pathway = Pathway.objects.create(
            name="Parent Pathway", status=Status.PUBLISHED, base_price=100
        )
        PathwayCourse.objects.create(pathway=self.pathway, course=self.course_a, order=1)
        PathwayCourse.objects.create(pathway=self.pathway, course=self.course_b, order=2)

        self.second_pathway = Pathway.objects.create(
            name="Athlete Pathway", status=Status.PUBLISHED, base_price=50
        )


class PathwayPermissionTests(PathwayTestCase):
    def test_public_list_only_shows_published(self):
        Pathway.objects.create(name="Draft Pathway", status=Status.DRAFT, base_price=10)
        response = self.client.get(reverse("pathway-public-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [row["name"] for row in response.data["data"]["results"]]
        self.assertNotIn("Draft Pathway", names)

    def test_non_admin_cannot_create_pathway(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("pathway-list-create"), {"name": "New Pathway", "base_price": 10})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_pathway(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse("pathway-list-create"), {"name": "New Pathway", "base_price": 10})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Pathway.objects.filter(name="New Pathway").exists())


class PathwayCheckoutTests(PathwayTestCase):
    def test_checkout_grants_pathway_and_course_enrollments(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("pathway-checkout"), {"pathway_ids": [self.pathway.id]}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["enrolled_pathways"]), 1)
        self.assertEqual(data["enrolled_pathways"][0]["price_paid"], "100.00")

        self.assertTrue(
            PathwayEnrollment.objects.filter(user=self.student, pathway=self.pathway).exists()
        )
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.course_a).exists())
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.course_b).exists())

    def test_checkout_is_idempotent_for_already_owned_pathway(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(reverse("pathway-checkout"), {"pathway_ids": [self.pathway.id]}, format="json")

        response = self.client.post(reverse("pathway-checkout"), {"pathway_ids": [self.pathway.id]}, format="json")
        data = response.data["data"]
        self.assertEqual(len(data["enrolled_pathways"]), 0)
        self.assertEqual(len(data["already_enrolled_pathways"]), 1)
        self.assertEqual(PathwayEnrollment.objects.filter(user=self.student, pathway=self.pathway).count(), 1)

    def test_bundle_discount_applied_across_multiple_pathways(self):
        PathwayBundleRule.objects.create(pathway_count=2, discount_percent=20)

        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("pathway-checkout"),
            {"pathway_ids": [self.pathway.id, self.second_pathway.id]},
            format="json",
        )

        data = response.data["data"]
        prices = {row["pathway_id"]: row["price_paid"] for row in data["enrolled_pathways"]}
        # base 100 * 0.8 = 80.00, base 50 * 0.8 = 40.00
        self.assertEqual(prices[self.pathway.id], "80.00")
        self.assertEqual(prices[self.second_pathway.id], "40.00")

    def test_checkout_rejects_unpublished_pathway(self):
        draft = Pathway.objects.create(name="Draft", status=Status.DRAFT, base_price=10)
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("pathway-checkout"), {"pathway_ids": [draft.id]}, format="json")

        data = response.data["data"]
        self.assertEqual(len(data["failed_pathways"]), 1)
        self.assertFalse(PathwayEnrollment.objects.filter(user=self.student, pathway=draft).exists())

    def test_non_student_cannot_checkout(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(reverse("pathway-checkout"), {"pathway_ids": [self.pathway.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PathwayCourseOrderTests(PathwayTestCase):
    def test_admin_can_reorder_pathway_courses(self):
        pc_a = PathwayCourse.objects.get(pathway=self.pathway, course=self.course_a)
        pc_b = PathwayCourse.objects.get(pathway=self.pathway, course=self.course_b)

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("pathway-course-order", args=[self.pathway.id]),
            [
                {"pathwaycourse_id": pc_a.id, "order": 2},
                {"pathwaycourse_id": pc_b.id, "order": 1},
            ],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pc_a.refresh_from_db()
        pc_b.refresh_from_db()
        self.assertEqual(pc_a.order, 2)
        self.assertEqual(pc_b.order, 1)


class GuestCheckoutTests(APITestCase):
    def test_guest_cannot_checkout_pathways(self):
        response = self.client.post(reverse("pathway-checkout"), {"pathway_ids": [1]}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(PathwayEnrollment.objects.exists())


class PathwayDetailContentTestCase(APITestCase):
    """The marketing fields behind the public pathway page (/pathways/<slug>)."""

    def setUp(self):
        self.admin = make_user("content-admin@example.com", UserModel.Roles.ADMIN)
        self.pathway = Pathway.objects.create(
            name="NIL And Legacy",
            status=Status.PUBLISHED,
            base_price=249,
            purpose="Built for athletes signing their first NIL deal.",
            learning_outcomes=["Read an NIL term sheet", "Spot an unfair royalty clause"],
            who_is_for=["Student-athletes entering junior year"],
            prerequisites=["Completed Tier 1 orientation"],
            difficulty=Pathway.Difficulty.ADVANCED,
            duration_weeks=12,
        )

    def test_public_detail_by_slug_returns_marketing_fields(self):
        response = self.client.get(
            reverse("pathway-public-detail-by-slug", args=[self.pathway.slug])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["purpose"], "Built for athletes signing their first NIL deal.")
        self.assertEqual(len(data["learning_outcomes"]), 2)
        self.assertEqual(data["who_is_for"], ["Student-athletes entering junior year"])
        self.assertEqual(data["prerequisites"], ["Completed Tier 1 orientation"])
        self.assertEqual(data["difficulty"], "ADVANCED")
        self.assertEqual(data["duration_weeks"], 12)

    def test_public_detail_by_slug_is_anonymous_and_hides_drafts(self):
        draft = Pathway.objects.create(name="Draft Route", status=Status.DRAFT)
        response = self.client.get(reverse("pathway-public-detail-by-slug", args=[draft.slug]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_detail_by_slug_unknown_slug_is_404(self):
        response = self.client.get(reverse("pathway-public-detail-by-slug", args=["no-such-route"]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_list_exposes_badge_fields(self):
        response = self.client.get(reverse("pathway-public-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = response.data["data"]["results"][0]
        self.assertIn("difficulty", row)
        self.assertIn("duration_weeks", row)

    def test_admin_can_write_marketing_fields_and_blanks_are_dropped(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            reverse("pathway-detail", args=[self.pathway.id]),
            {"learning_outcomes": ["  Draft a cap table ", "", "Negotiate   terms"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pathway.refresh_from_db()
        self.assertEqual(self.pathway.learning_outcomes, ["Draft a cap table", "Negotiate terms"])

    def test_bullet_lists_accept_a_json_encoded_string(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            reverse("pathway-detail", args=[self.pathway.id]),
            {"who_is_for": '["Parents", "Coaches"]'},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pathway.refresh_from_db()
        self.assertEqual(self.pathway.who_is_for, ["Parents", "Coaches"])

    def test_bullet_lists_reject_too_many_points_and_overlong_text(self):
        self.client.force_authenticate(self.admin)
        url = reverse("pathway-detail", args=[self.pathway.id])
        too_many = self.client.patch(
            url, {"learning_outcomes": [f"Point {i}" for i in range(13)]}, format="json"
        )
        self.assertEqual(too_many.status_code, status.HTTP_400_BAD_REQUEST)
        too_long = self.client.patch(
            url, {"prerequisites": ["x" * 301]}, format="json"
        )
        self.assertEqual(too_long.status_code, status.HTTP_400_BAD_REQUEST)
        not_text = self.client.patch(url, {"who_is_for": [7]}, format="json")
        self.assertEqual(not_text.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_write_marketing_fields(self):
        student = make_user("content-student@example.com", UserModel.Roles.STUDENT)
        self.client.force_authenticate(student)
        response = self.client.patch(
            reverse("pathway-detail", args=[self.pathway.id]),
            {"purpose": "hijacked"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AudienceMappingTests(PathwayTestCase):
    """Audience <-> pathway relations and the public filters built on them."""

    def setUp(self):
        super().setUp()
        self.athletes = Audience.objects.get(slug="student-athletes")
        self.coaches = Audience.objects.get(slug="coaches")
        self.parents = Audience.objects.get(slug="parents")

        # `self.pathway` holds course_a + course_b; `self.second_pathway` is empty.
        self.pathway.audiences.set([self.parents])
        self.second_pathway.audiences.set([self.athletes, self.coaches])

    def test_audiences_are_seeded_and_publicly_listed(self):
        response = self.client.get(reverse("pathway-audiences"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [row["slug"] for row in response.data["data"]]
        self.assertEqual(
            slugs,
            [
                "student-athletes",
                "cool-nerds",
                "parents",
                "institutions-academies",
                "coaches",
                "entrepreneurs",
            ],
        )

    def test_public_list_exposes_audiences_on_each_pathway(self):
        response = self.client.get(reverse("pathway-public-list"))
        rows = {row["name"]: row for row in response.data["data"]["results"]}
        self.assertEqual(
            sorted(a["slug"] for a in rows["Athlete Pathway"]["audiences"]),
            ["coaches", "student-athletes"],
        )
        self.assertEqual([a["slug"] for a in rows["Parent Pathway"]["audiences"]], ["parents"])

    def test_public_list_filters_by_audience(self):
        response = self.client.get(reverse("pathway-public-list"), {"audience": "coaches"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [row["name"] for row in response.data["data"]["results"]]
        self.assertEqual(names, ["Athlete Pathway"])

    def test_a_pathway_can_serve_several_audiences(self):
        for slug in ("student-athletes", "coaches"):
            response = self.client.get(reverse("pathway-public-list"), {"audience": slug})
            names = [row["name"] for row in response.data["data"]["results"]]
            self.assertEqual(names, ["Athlete Pathway"], msg=slug)

    def test_audience_filter_hides_unpublished_pathways(self):
        draft = Pathway.objects.create(name="Draft Athlete", status=Status.DRAFT, base_price=10)
        draft.audiences.set([self.athletes])
        response = self.client.get(reverse("pathway-public-list"), {"audience": "student-athletes"})
        names = [row["name"] for row in response.data["data"]["results"]]
        self.assertNotIn("Draft Athlete", names)

    def test_unknown_audience_returns_an_empty_list_not_an_error(self):
        response = self.client.get(reverse("pathway-public-list"), {"audience": "nope"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["results"], [])

    def test_public_course_count_ignores_unpublished_courses(self):
        self.course_b.status = Status.DRAFT
        self.course_b.save()
        response = self.client.get(reverse("pathway-public-list"), {"audience": "parents"})
        row = response.data["data"]["results"][0]
        self.assertEqual(row["name"], "Parent Pathway")
        self.assertEqual(row["course_count"], 1)

    def test_admin_can_set_and_clear_audiences(self):
        self.client.force_authenticate(self.admin)
        url = reverse("pathway-detail", args=[self.pathway.id])

        response = self.client.patch(url, {"audience_slugs": ["coaches", "parents"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            sorted(self.pathway.audiences.values_list("slug", flat=True)),
            ["coaches", "parents"],
        )

        response = self.client.patch(url, {"audience_slugs": []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(list(self.pathway.audiences.all()), [])

    def test_omitting_audience_slugs_leaves_existing_relations_alone(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            reverse("pathway-detail", args=[self.pathway.id]),
            {"summary": "Renamed summary"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([a.slug for a in self.pathway.audiences.all()], ["parents"])

    def test_unknown_audience_slug_is_rejected_on_write(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            reverse("pathway-detail", args=[self.pathway.id]),
            {"audience_slugs": ["not-an-audience"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual([a.slug for a in self.pathway.audiences.all()], ["parents"])

    def test_non_admin_cannot_change_audiences(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.patch(
            reverse("pathway-detail", args=[self.pathway.id]),
            {"audience_slugs": ["coaches"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_a_pathway_with_audiences(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            reverse("pathway-list-create"),
            {
                "name": "NIL Branding",
                "summary": "Brand and NIL basics.",
                "base_price": 120,
                "audience_slugs": ["student-athletes"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Pathway.objects.get(name="NIL Branding")
        self.assertEqual([a.slug for a in created.audiences.all()], ["student-athletes"])


class AudienceCourseListTests(PathwayTestCase):
    """`/courses/public/?audience=` — the course half of an audience page."""

    def setUp(self):
        super().setUp()
        self.athletes = Audience.objects.get(slug="student-athletes")
        self.pathway.audiences.set([self.athletes])

    def test_lists_courses_reachable_through_that_audience(self):
        response = self.client.get(reverse("course-public-list"), {"audience": "student-athletes"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [row["title"] for row in response.data["data"]["results"]]
        self.assertEqual(titles, ["Course A", "Course B"])

    def test_a_course_in_two_pathways_of_one_audience_is_listed_once(self):
        other = Pathway.objects.create(name="Second Athlete", status=Status.PUBLISHED)
        other.audiences.set([self.athletes])
        PathwayCourse.objects.create(pathway=other, course=self.course_a, order=1)

        response = self.client.get(reverse("course-public-list"), {"audience": "student-athletes"})
        titles = [row["title"] for row in response.data["data"]["results"]]
        self.assertEqual(titles.count("Course A"), 1)

    def test_courses_behind_an_unpublished_pathway_are_hidden(self):
        self.pathway.status = Status.DRAFT
        self.pathway.save()
        response = self.client.get(reverse("course-public-list"), {"audience": "student-athletes"})
        self.assertEqual(response.data["data"]["results"], [])

    def test_unpublished_courses_are_hidden(self):
        self.course_a.status = Status.DRAFT
        self.course_a.save()
        response = self.client.get(reverse("course-public-list"), {"audience": "student-athletes"})
        titles = [row["title"] for row in response.data["data"]["results"]]
        self.assertEqual(titles, ["Course B"])

    def test_unknown_audience_returns_an_empty_list(self):
        response = self.client.get(reverse("course-public-list"), {"audience": "nope"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["results"], [])

    def test_no_audience_param_still_lists_every_published_course(self):
        response = self.client.get(reverse("course-public-list"))
        titles = [row["title"] for row in response.data["data"]["results"]]
        self.assertEqual(titles, ["Course A", "Course B"])
