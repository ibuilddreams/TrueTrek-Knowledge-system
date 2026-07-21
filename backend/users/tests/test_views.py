from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

UserModel = get_user_model()

LOGIN_URL = "/api/auth/login/"


class CustomTokenObtainPairViewTests(APITestCase):
    def setUp(self):
        self.user = UserModel.objects.create_user(
            username="loginviewuser",
            email="loginviewuser@example.com",
            password="StrongPass123!",
        )

    def test_login_success_returns_200_and_tokens(self):
        response = self.client.post(
            LOGIN_URL,
            {"email": "loginviewuser@example.com", "password": "StrongPass123!"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"] if "success" in response.data else True)
        self.assertIn("data", response.data)
        self.assertIn("access_token", response.data["data"])
        self.assertIn("refresh_token", response.data["data"])

    def test_login_invalid_credentials_returns_error_shape(self):
        response = self.client.post(
            LOGIN_URL,
            {"email": "loginviewuser@example.com", "password": "WrongPassword!"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", response.data)

    def test_login_inactive_user_returns_error(self):
        self.user.is_active = False
        self.user.save()

        response = self.client.post(
            LOGIN_URL,
            {"email": "loginviewuser@example.com", "password": "StrongPass123!"},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("message", response.data)


class StudentListCreateViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("student-list-create")

        self.admin = UserModel.objects.create_user(
            username="adminuser",
            email="adminuser@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
        )

        self.student = UserModel.objects.create_user(
            username="existingstudent",
            email="existingstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
        )

        self.teacher = UserModel.objects.create_user(
            username="existingteacher",
            email="existingteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
        )

    def _valid_student_payload(self, **overrides):
        payload = {
            "username": "brandnewstudent",
            "first_name": "Brand",
            "last_name": "New",
            "email": "brandnewstudent@example.com",
            "password": "StrongPass123!",
            "gender": UserModel.Gender.MALE,
        }
        payload.update(overrides)
        return payload

    def test_list_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_students(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_usernames = [item["username"] for item in response.data["data"]["users"]]

        self.assertIn("existingstudent", returned_usernames)
        self.assertNotIn("existingteacher", returned_usernames)
        self.assertNotIn("adminuser", returned_usernames)

    def test_list_response_is_paginated_with_users_key(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertIn("users", response.data["data"])
        self.assertNotIn("results", response.data["data"])

    def test_create_requires_authentication(self):
        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_valid_data_returns_201(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            UserModel.objects.filter(username="brandnewstudent", role=UserModel.Roles.STUDENT).exists()
        )

    def test_create_invalid_data_returns_400(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self._valid_student_payload(email="existingstudent@example.com"),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_forbidden_for_teacher(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(UserModel.objects.filter(username="brandnewstudent").exists())

    def test_create_forbidden_for_student(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(UserModel.objects.filter(username="brandnewstudent").exists())
