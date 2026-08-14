from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from ..models import Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment

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
