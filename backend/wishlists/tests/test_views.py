from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course

from ..models import WishlistItem

UserModel = get_user_model()


class WishlistViewTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("wishlist-list-create")
        category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(
            title="Intro to Python", code="PY-101", category=category, status=Status.PUBLISHED
        )
        self.draft = Course.objects.create(
            title="Draft", code="DR-101", category=category, status=Status.DRAFT
        )
        self.student = UserModel.objects.create_user(
            username="wishstudent", email="wishstudent@example.com", password="StrongPass123!",
            role=UserModel.Roles.STUDENT, gender=UserModel.Gender.MALE,
        )
        self.other = UserModel.objects.create_user(
            username="wishother", email="wishother@example.com", password="StrongPass123!",
            role=UserModel.Roles.STUDENT, gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="wishteacher", email="wishteacher@example.com", password="StrongPass123!",
            role=UserModel.Roles.TEACHER, gender=UserModel.Gender.MALE,
        )

    def test_requires_authentication(self):
        self.assertIn(
            self.client.get(self.list_url).status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_teacher_is_forbidden(self):
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_student_can_add_and_list(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(self.list_url, {"course": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        listed = self.client.get(self.list_url)
        self.assertEqual([item["course"]["id"] for item in listed.data["data"]], [self.course.id])

    def test_cannot_add_duplicate_or_draft(self):
        WishlistItem.objects.create(user=self.student, course=self.course)
        self.client.force_authenticate(self.student)

        self.assertEqual(
            self.client.post(self.list_url, {"course": self.course.id}).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(self.list_url, {"course": self.draft.id}).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_wishlists_are_private_per_student(self):
        WishlistItem.objects.create(user=self.other, course=self.course)
        self.client.force_authenticate(self.student)

        self.assertEqual(self.client.get(self.list_url).data["data"], [])

    def test_remove(self):
        WishlistItem.objects.create(user=self.student, course=self.course)
        self.client.force_authenticate(self.student)
        url = reverse("wishlist-detail", args=[self.course.id])

        self.assertEqual(self.client.delete(url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
