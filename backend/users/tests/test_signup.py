from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

UserModel = get_user_model()

#: What the browser sends from `npm run dev`. The API is on another origin, so
#: every request from the SPA carries one of these.
SPA_ORIGIN = "http://localhost:3000"


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
            "role": UserModel.Roles.STUDENT,
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

    def test_signup_defaults_to_student_when_role_is_omitted(self):
        # The role field was added after this endpoint shipped, so a caller that
        # sends no role at all must still get a student account.
        payload = self._payload()
        payload.pop("role", None)
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            UserModel.objects.get(email="newstudent@example.com").role,
            UserModel.Roles.STUDENT,
        )

    def test_signup_creates_teacher_and_returns_tokens(self):
        response = self.client.post(
            self.url,
            self._payload(
                username="newteacher",
                email="newteacher@example.com",
                role=UserModel.Roles.TEACHER,
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data["data"]
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data["user"]["role"], UserModel.Roles.TEACHER)

        user = UserModel.objects.get(email="newteacher@example.com")
        self.assertEqual(user.role, UserModel.Roles.TEACHER)
        self.assertTrue(user.is_teacher)
        self.assertTrue(user.is_active)
        self.assertEqual(user.account_status, UserModel.AccountStatus.ACTIVE)
        self.assertFalse(user.is_advisor)
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_signup_teacher_can_log_in(self):
        self.client.post(
            self.url,
            self._payload(
                username="newteacher",
                email="newteacher@example.com",
                role=UserModel.Roles.TEACHER,
            ),
            format="json",
        )
        response = self.client.post(
            "/api/auth/login/",
            {"email": "newteacher@example.com", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["user"]["role"], UserModel.Roles.TEACHER)

    def test_signup_rejects_admin_role(self):
        # Nobody may hand themselves an admin account through the public form.
        response = self.client.post(
            self.url, self._payload(role=UserModel.Roles.ADMIN), format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(UserModel.objects.filter(email="newstudent@example.com").exists())

    def test_signup_rejects_unknown_role(self):
        response = self.client.post(self.url, self._payload(role="WIZARD"), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(UserModel.objects.filter(email="newstudent@example.com").exists())

    def test_signup_rejects_duplicate_email(self):
        UserModel.objects.create_user(
            username="existing",
            email="newstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
        )
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PublicAuthCsrfTests(APITestCase):
    """A stray Django admin session must not break the public auth endpoints.

    `apiClient` sends `credentials: "include"`, so a developer who has logged
    into /admin/ has their `sessionid` travel with every SPA request. With
    SessionAuthentication left on these views DRF authenticated the request as
    that admin and then enforced CSRF on it — which the SPA cannot satisfy
    from another origin with no CSRF token, so signing up failed with
    "CSRF Failed: Origin checking failed".
    """

    def setUp(self):
        # The default test client sets `_dont_enforce_csrf_checks`, which is
        # exactly the check being regressed — so this one must not.
        self.client = APIClient(enforce_csrf_checks=True)
        self.admin = UserModel.objects.create_user(
            username="siteadmin",
            email="siteadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
        )
        # Django's own session cookie, as /admin/ would have left it.
        self.client.force_login(self.admin)

    def test_signup_works_while_a_django_admin_session_cookie_is_present(self):
        response = self.client.post(
            "/api/auth/signup/",
            {
                "username": "newteacher",
                "first_name": "New",
                "last_name": "Teacher",
                "email": "newteacher@example.com",
                "password": "StrongPass123!",
                "role": UserModel.Roles.TEACHER,
            },
            format="json",
            HTTP_ORIGIN=SPA_ORIGIN,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            UserModel.objects.get(email="newteacher@example.com").role,
            UserModel.Roles.TEACHER,
        )

    def test_the_other_public_auth_endpoints_are_reachable_too(self):
        # Login and refresh never had the bug (SimpleJWT clears
        # authentication_classes itself); these three are the ones that did.
        for url, payload in (
            ("/api/auth/forgot-password/", {"email": "siteadmin@example.com"}),
            ("/api/auth/reset-password/", {"uid": "x", "token": "y", "new_password": "a", "confirm_password": "a"}),
            ("/api/auth/google/", {"credential": "not-a-real-token"}),
        ):
            with self.subTest(url=url):
                response = self.client.post(url, payload, format="json", HTTP_ORIGIN=SPA_ORIGIN)
                # Any of these may legitimately reject the payload; what must
                # never happen is being turned away at the door with a 403.
                self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_is_unaffected(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "siteadmin@example.com", "password": "StrongPass123!"},
            format="json",
            HTTP_ORIGIN=SPA_ORIGIN,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
