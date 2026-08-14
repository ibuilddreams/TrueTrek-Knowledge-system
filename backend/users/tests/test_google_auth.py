from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

UserModel = get_user_model()

GOOGLE_PAYLOAD = {
    "email": "newgoogleuser@example.com",
    "email_verified": True,
    "given_name": "Ada",
    "family_name": "Lovelace",
}


@override_settings(GOOGLE_CLIENT_ID="test-client-id")
class GoogleAuthViewTests(APITestCase):
    url = "/api/auth/google/"

    @patch("users.serializers.google_id_token.verify_oauth2_token")
    def test_creates_student_account_on_first_sign_in(self, mock_verify):
        mock_verify.return_value = dict(GOOGLE_PAYLOAD)

        response = self.client.post(self.url, {"credential": "fake-token"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], UserModel.Roles.STUDENT)

        user = UserModel.objects.get(email="newgoogleuser@example.com")
        self.assertEqual(user.role, UserModel.Roles.STUDENT)
        self.assertEqual(user.gender, UserModel.Gender.OTHER)
        self.assertFalse(user.has_usable_password())

    @patch("users.serializers.google_id_token.verify_oauth2_token")
    def test_logs_in_existing_user_without_creating_duplicate(self, mock_verify):
        mock_verify.return_value = dict(GOOGLE_PAYLOAD)
        existing = UserModel.objects.create_user(
            username="adalovelace",
            email="newgoogleuser@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.FEMALE,
        )

        response = self.client.post(self.url, {"credential": "fake-token"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(UserModel.objects.filter(email="newgoogleuser@example.com").count(), 1)
        self.assertEqual(response.data["data"]["user"]["id"], existing.id)

    @patch("users.serializers.google_id_token.verify_oauth2_token")
    def test_rejects_unverified_email(self, mock_verify):
        mock_verify.return_value = {**GOOGLE_PAYLOAD, "email_verified": False}

        response = self.client.post(self.url, {"credential": "fake-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(UserModel.objects.filter(email="newgoogleuser@example.com").exists())

    @patch("users.serializers.google_id_token.verify_oauth2_token")
    def test_rejects_invalid_token(self, mock_verify):
        mock_verify.side_effect = ValueError("Token expired")

        response = self.client.post(self.url, {"credential": "bad-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("users.serializers.google_id_token.verify_oauth2_token")
    def test_rejects_inactive_existing_account(self, mock_verify):
        mock_verify.return_value = dict(GOOGLE_PAYLOAD)
        existing = UserModel.objects.create_user(
            username="adalovelace",
            email="newgoogleuser@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.FEMALE,
        )
        existing.is_active = False
        existing.save(update_fields=["is_active"])

        response = self.client.post(self.url, {"credential": "fake-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(GOOGLE_CLIENT_ID="")
    def test_rejects_when_not_configured(self):
        response = self.client.post(self.url, {"credential": "fake-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
