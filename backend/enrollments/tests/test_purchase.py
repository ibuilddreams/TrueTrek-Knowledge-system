from django.urls import reverse
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment
from users.models import CustomUser


class CoursePurchaseTests(APITestCase):
    def setUp(self):
        self.student = CustomUser.objects.create_user(
            username="buyer", email="buyer@example.com", password="pw-123456", role="STUDENT"
        )
        self.teacher = CustomUser.objects.create_user(
            username="t1", email="t1@example.com", password="pw-123456", role="TEACHER"
        )
        category = Category.objects.create(name="Cat")
        self.course = Course.objects.create(
            title="Buyable", code="TST-001", category=category,
            status=Status.PUBLISHED, amount=10
        )
        CourseInstructor.objects.create(course=self.course, instructor=self.teacher)
        self.draft = Course.objects.create(
            title="Draft", code="TST-002", category=category,
            status=Status.DRAFT, amount=10
        )
        self.client.force_authenticate(self.student)
        self.url = reverse("enrollment-purchase")

    def test_buys_a_course_and_enrolls(self):
        res = self.client.post(self.url, {"course_ids": [self.course.id]}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(len(res.data["data"]["enrolled"]), 1)
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.course).exists())

    def test_accepts_a_bare_id(self):
        res = self.client.post(self.url, {"course_ids": self.course.id}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.course).exists())

    def test_buying_twice_is_not_an_error_and_does_not_duplicate(self):
        self.client.post(self.url, {"course_ids": [self.course.id]}, format="json")
        res = self.client.post(self.url, {"course_ids": [self.course.id]}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(len(res.data["data"]["already_enrolled"]), 1)
        self.assertEqual(
            Enrollment.objects.filter(student=self.student, course=self.course).count(), 1
        )

    def test_unpublished_course_is_refused(self):
        res = self.client.post(self.url, {"course_ids": [self.draft.id]}, format="json")
        self.assertEqual(res.status_code, 400, res.data)
        self.assertFalse(Enrollment.objects.filter(student=self.student).exists())

    def test_rejects_a_bad_payload(self):
        for payload in ({}, {"course_ids": []}, {"course_ids": "x"}, {"course_ids": [True]}):
            res = self.client.post(self.url, payload, format="json")
            self.assertEqual(res.status_code, 400, payload)

    def test_requires_a_student(self):
        self.client.force_authenticate(self.teacher)
        res = self.client.post(self.url, {"course_ids": [self.course.id]}, format="json")
        self.assertEqual(res.status_code, 403, res.data)
