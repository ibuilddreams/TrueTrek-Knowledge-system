from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from users.backends import EmailOrUsernameModelBackend

UserModel = get_user_model()


class EmailOrUsernameModelBackendTests(TestCase):
    def setUp(self):
        self.backend = EmailOrUsernameModelBackend()
        self.user = UserModel.objects.create_user(
            username="backenduser",
            email="backenduser@example.com",
            password="StrongPass123!",
        )

    def test_authenticate_with_username(self):
        authenticated = self.backend.authenticate(
            request=None, username="backenduser", password="StrongPass123!"
        )

        self.assertEqual(authenticated, self.user)

    def test_authenticate_with_email(self):
        authenticated = self.backend.authenticate(
            request=None, username="backenduser@example.com", password="StrongPass123!"
        )

        self.assertEqual(authenticated, self.user)

    def test_authenticate_wrong_password_returns_none(self):
        authenticated = self.backend.authenticate(
            request=None, username="backenduser", password="WrongPassword!"
        )

        self.assertIsNone(authenticated)

    def test_authenticate_nonexistent_user_returns_none(self):
        authenticated = self.backend.authenticate(
            request=None, username="nosuchuser", password="StrongPass123!"
        )

        self.assertIsNone(authenticated)

    def test_authenticate_duplicate_email_falls_back_to_username(self):
        with patch.object(UserModel.objects, "get", side_effect=UserModel.MultipleObjectsReturned):
            authenticated = self.backend.authenticate(
                request=None, username="backenduser", password="StrongPass123!"
            )

        self.assertEqual(authenticated, self.user)
