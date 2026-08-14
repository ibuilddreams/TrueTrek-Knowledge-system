from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

UserModel = get_user_model()


class SignupViewTests(APITestCase):
    # No `name=` kwarg exists for this route (matching the other api/auth/* routes
    # in lms_be/urls.py, none of which are named either) — hit the path directly.
    url = "/api/auth/signup/"

    def _payload(self, **overrides):
        payload = {
            "username": "newstudent",
            "first_name": "New",
            "last_name": "Student",
            "email": "newstudent@example.com",
            "password": "StrongPass123!",
            "gender": UserModel.Gender.MALE,
        }
        payload.update(overrides)
        return payload

    def test_signup_creates_student_and_returns_tokens(self):
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data["data"]
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data["user"]["role"], UserModel.Roles.STUDENT)

        user = UserModel.objects.get(email="newstudent@example.com")
        self.assertEqual(user.role, UserModel.Roles.STUDENT)
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_signup_rejects_duplicate_email(self):
        UserModel.objects.create_user(
            username="existing",
            email="newstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
