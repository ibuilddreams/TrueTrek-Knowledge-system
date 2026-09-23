from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework.test import APIClient, APITransactionTestCase
from django.test import skipUnlessDBFeature

from audit_logs.models import AuditLog
from notifications.models import Notification
from users.models import CustomUser, InvitationFeedback, UserInvitation


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", INVITATION_EXPIRY_HOURS=72, PRAXIN_CLIENT_EMAIL="owner@example.com")
class InvitationTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.admin = CustomUser.objects.create_user(
            username="admin", email="admin@example.com", password="Complex-pass-987", gender="OTHER", role="ADMIN")
        self.client.force_authenticate(self.admin)

    def invite(self, approved=False, email="invited@example.com", role="TEACHER"):
        response = self.client.post("/api/invitations/", {
            "first_name": "New", "last_name": "User", "email": email,
            "role": role, "nda_approved": approved,
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response["Cache-Control"], "no-store")
        return response.data["data"]

    def setup_payload(self, link):
        values = {key: value[0] for key, value in parse_qs(urlsplit(link).fragment).items()}
        return {**values, "password": "A-unique-new-pass-762!", "confirm_password": "A-unique-new-pass-762!", "gender": "FEMALE"}

    def accept(self, link):
        self.client.force_authenticate(None)
        response = self.client.post("/api/invitations/accept/", self.setup_payload(link), format="json")
        self.assertEqual(response.status_code, 200, response.data)
        return CustomUser.objects.get(email="invited@example.com")

    def test_pending_invite_sends_notice_without_access_or_feedback(self):
        data = self.invite()
        invitation = UserInvitation.objects.get(pk=data["id"])
        self.assertFalse(invitation.user.is_active)
        self.assertFalse(invitation.user.has_usable_password())
        self.assertNotIn("setup_link", data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("pending NDA", mail.outbox[0].body)
        self.assertNotIn("/feedback", mail.outbox[0].body)
        self.assertNotIn("accept-invitation", mail.outbox[0].body)
        self.assertEqual(Notification.objects.count(), 0)
        self.client.force_authenticate(invitation.user)
        self.assertEqual(self.client.get("/api/feedback/").status_code, 403)
        self.assertFalse(self.client.get("/api/feedback/status/").data["data"]["eligible"])

    def test_approval_is_audited_idempotent_and_only_targets_invitee(self):
        data = self.invite()
        other = self.invite(email="other@example.com")
        url = f'/api/invitations/{data["id"]}/approve/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        invitation = UserInvitation.objects.get(pk=data["id"])
        self.assertTrue(invitation.nda_approved)
        self.assertEqual(invitation.nda_approved_by, self.admin)
        self.assertIsNotNone(invitation.nda_approved_at)
        self.assertFalse(invitation.user.is_active)
        self.assertEqual(len(mail.outbox), 3)
        self.assertEqual(mail.outbox[-1].to, [invitation.user.email])
        self.assertIn("/feedback", mail.outbox[-1].body)
        self.assertEqual(Notification.objects.get().recipient, invitation.user)
        self.assertTrue(AuditLog.objects.filter(object_id=data["id"], new_values={"nda_approved": True}).exists())
        repeat = self.client.post(url)
        self.assertNotIn("setup_link", repeat.data["data"])
        self.assertEqual(len(mail.outbox), 3)
        self.assertEqual(Notification.objects.count(), 1)
        self.assertFalse(UserInvitation.objects.get(pk=other["id"]).nda_approved)

    def test_setup_preserves_role_activates_and_consumes_token(self):
        data = self.invite(approved=True)
        user = self.accept(data["setup_link"])
        self.assertTrue(user.is_active)
        self.assertEqual(user.role, "TEACHER")
        self.assertTrue(user.check_password("A-unique-new-pass-762!"))
        self.assertEqual(user.gender, "FEMALE")
        self.assertEqual(UserInvitation.objects.get(user=user).token_hash, "")
        repeat = self.client.post("/api/invitations/accept/", self.setup_payload(data["setup_link"]), format="json")
        self.assertEqual(repeat.status_code, 400)
        login = self.client.post("/api/auth/login/", {"email": user.email, "password": "A-unique-new-pass-762!"})
        self.assertEqual(login.status_code, 200, login.data)

    def test_invalid_expired_and_unapproved_links_cannot_activate(self):
        data = self.invite(approved=True)
        payload = self.setup_payload(data["setup_link"])
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/invitations/accept/", {**payload, "token": "wrong"}).status_code, 400)
        UserInvitation.objects.filter(pk=data["id"]).update(token_expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.post("/api/invitations/accept/", payload).status_code, 400)
        UserInvitation.objects.filter(pk=data["id"]).update(token_expires_at=timezone.now() + timedelta(hours=1), nda_approved=False)
        self.assertEqual(self.client.post("/api/invitations/accept/", payload).status_code, 400)
        self.assertFalse(CustomUser.objects.get(email="invited@example.com").is_active)

    def test_password_validation_does_not_consume_link(self):
        data = self.invite(approved=True)
        payload = self.setup_payload(data["setup_link"])
        self.client.force_authenticate(None)
        for overrides in [{"password": "short", "confirm_password": "short"}, {"confirm_password": "different"}]:
            self.assertEqual(self.client.post("/api/invitations/accept/", {**payload, **overrides}).status_code, 400)
        self.assertIsNone(UserInvitation.objects.get(pk=data["id"]).accepted_at)
        self.accept(data["setup_link"])

    def test_regeneration_invalidates_previous_link(self):
        data = self.invite(approved=True)
        response = self.client.post(f'/api/invitations/{data["id"]}/link/', {"send_email": False}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/invitations/accept/", self.setup_payload(data["setup_link"])).status_code, 400)
        self.accept(response.data["data"]["setup_link"])
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f'/api/invitations/{data["id"]}/link/').status_code, 400)

    def test_feedback_requires_approval_and_is_once_per_recipient(self):
        data = self.invite(approved=True, role="STUDENT")
        user = self.accept(data["setup_link"])
        self.assertEqual(self.client.get("/api/feedback/").status_code, 401)
        self.client.force_authenticate(user)
        self.assertTrue(self.client.get("/api/feedback/status/").data["data"]["eligible"])
        self.assertIsNone(self.client.get("/api/feedback/").data["data"]["response"])
        payload = {"rating": 5, "comments": "Helpful platform", "suggestions": "More examples"}
        self.assertEqual(self.client.post("/api/feedback/", {**payload, "rating": 6}).status_code, 400)
        self.assertEqual(self.client.post("/api/feedback/", {**payload, "comments": "  "}).status_code, 400)
        self.assertEqual(self.client.post("/api/feedback/", payload).status_code, 201)
        self.assertEqual(self.client.post("/api/feedback/", payload).status_code, 400)
        self.assertTrue(self.client.get("/api/feedback/status/").data["data"]["submitted"])
        self.assertEqual(InvitationFeedback.objects.count(), 1)
        self.client.force_authenticate(self.admin)
        result = self.client.get("/api/invitations/").data["data"]["results"][0]
        self.assertEqual(result["feedback"]["comments"], "Helpful platform")
        self.assertNotIn("token_hash", result)
        self.assertNotIn("setup_link", result)

    def test_non_invited_user_cannot_access_feedback_or_admin_operations(self):
        data = self.invite()
        student = CustomUser.objects.create_user(username="ordinary", email="ordinary@example.com", gender="OTHER", role="STUDENT")
        self.client.force_authenticate(student)
        for url in ["/api/feedback/", "/api/invitations/"]:
            self.assertEqual(self.client.get(url).status_code, 403)
        self.assertEqual(self.client.post(f'/api/invitations/{data["id"]}/approve/').status_code, 403)
        self.assertEqual(self.client.post(f'/api/invitations/{data["id"]}/link/').status_code, 403)
        self.assertEqual(self.client.post("/api/invitations/", {}).status_code, 403)
        self.assertEqual(self.client.post("/api/feedback/", {"rating": 5, "comments": "No access"}).status_code, 403)

    def test_pending_account_cannot_be_activated_via_existing_admin_edit(self):
        for role, resource in [("TEACHER", "teacher"), ("STUDENT", "student")]:
            data = self.invite(email=f"{role.lower()}@example.com", role=role)
            invitation = UserInvitation.objects.get(pk=data["id"])
            response = self.client.patch(f"/api/{resource}/{invitation.user_id}/admin/", {"account_status": "ACTIVE"}, format="json")
            self.assertEqual(response.status_code, 400, response.data)

    def test_duplicate_email_and_admin_role_rejected(self):
        self.invite()
        for payload in [{"email": "INVITED@example.com", "role": "STUDENT"}, {"email": "another@example.com", "role": "ADMIN"}]:
            response = self.client.post("/api/invitations/", {"first_name": "A", "last_name": "B", **payload})
            self.assertEqual(response.status_code, 400)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.console.EmailBackend")
    def test_console_email_is_not_claimed_as_sent(self):
        data = self.invite(approved=True)
        self.assertEqual(data["email_status"], "NOT_CONFIGURED")
        self.assertIn("setup_link", data)

    @patch("users.invitations.send_mail", side_effect=RuntimeError("secret SMTP error"))
    def test_email_failure_preserves_approval_and_manual_link(self, mocked):
        data = self.invite(approved=True)
        self.assertTrue(data["nda_approved"])
        self.assertEqual(data["email_status"], "FAILED")
        self.assertNotIn("secret", str(data))
        self.accept(data["setup_link"])

    def test_pending_email_cannot_be_claimed_through_signup_or_google(self):
        self.invite()
        self.client.force_authenticate(None)
        response = self.client.post("/api/auth/signup/", {"username": "claim", "email": "invited@example.com",
            "first_name": "Claim", "last_name": "User", "gender": "OTHER", "password": "Strong-new-pass-546!"})
        self.assertEqual(response.status_code, 400)
        from users.serializers import GoogleAuthSerializer
        from rest_framework.exceptions import PermissionDenied
        serializer = GoogleAuthSerializer()
        serializer._validated_data = {"credential": {"email": "invited@example.com"}}
        with self.assertRaises(PermissionDenied):
            serializer.save()

    def test_withdrawn_approval_and_suspended_user_cannot_read_or_submit(self):
        data = self.invite(approved=True)
        user = self.accept(data["setup_link"])
        self.client.force_authenticate(user)
        UserInvitation.objects.filter(pk=data["id"]).update(nda_approved=False)
        self.assertEqual(self.client.get("/api/feedback/").status_code, 403)
        UserInvitation.objects.filter(pk=data["id"]).update(nda_approved=True)
        user.account_status = "SUSPENDED"
        user.save(update_fields=["account_status"])
        self.assertEqual(self.client.post("/api/feedback/", {"rating": 4, "comments": "Test"}).status_code, 403)

    def test_feedback_emails_owner_once_and_contains_identity_and_rating(self):
        data = self.invite(approved=True)
        user = self.accept(data["setup_link"])
        self.client.force_authenticate(user)
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post("/api/feedback/", {"rating": 4, "comments": "Great platform"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(mail.outbox[-1].to, ["owner@example.com"])
        self.assertIn(user.email, mail.outbox[-1].body)
        self.assertIn("4 out of 5", mail.outbox[-1].body)
        self.assertIn("tab=invitations", mail.outbox[-1].body)
        self.assertEqual(len(mail.outbox[-1].alternatives), 1)
        self.assertEqual(InvitationFeedback.objects.get().admin_email_status, "SENT")
        count = len(mail.outbox)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f'/api/invitations/{data["id"]}/feedback-email/').status_code, 200)
        self.assertEqual(len(mail.outbox), count)

    def test_feedback_email_failure_preserves_response_and_admin_can_retry(self):
        data = self.invite(approved=True)
        user = self.accept(data["setup_link"])
        self.client.force_authenticate(user)
        with patch("users.invitations.send_mail", side_effect=RuntimeError("SMTP unavailable")):
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post("/api/feedback/", {"rating": 5, "comments": "Helpful"})
        self.assertEqual(response.status_code, 201)
        feedback = InvitationFeedback.objects.get()
        self.assertEqual(feedback.admin_email_status, "FAILED")
        url = f'/api/invitations/{data["id"]}/feedback-email/'
        self.assertEqual(self.client.post(url).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(url).status_code, 200)
        feedback.refresh_from_db()
        self.assertEqual(feedback.admin_email_status, "SENT")
        self.assertIsNotNone(feedback.admin_email_sent_at)

    def test_pending_invitation_failed_email_can_be_retried_without_granting_access(self):
        with patch("users.invitations.send_mail", side_effect=RuntimeError("SMTP unavailable")):
            data = self.invite()
        self.assertEqual(data["email_status"], "FAILED")
        url = f'/api/invitations/{data["id"]}/email/'
        result = self.client.post(url)
        self.assertEqual(result.data["data"]["email_status"], "SENT")
        self.assertNotIn("setup_link", result.data["data"])
        count = len(mail.outbox)
        self.client.post(url)
        self.assertEqual(len(mail.outbox), count)
        self.assertFalse(UserInvitation.objects.get(pk=data["id"]).user.is_active)


@skipUnlessDBFeature("has_select_for_update")
@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", PRAXIN_CLIENT_EMAIL="owner@example.com")
class InvitationConcurrencyTests(APITransactionTestCase):
    """Exercise real row locks on PostgreSQL, including double-clicks/retries."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.admin = CustomUser.objects.create_user(
            username="admin", email="admin@example.com", password=None, gender="OTHER", role="ADMIN")
        self.client.force_authenticate(self.admin)
        result = self.client.post("/api/invitations/", {"first_name": "Concurrent", "last_name": "User",
            "email": "concurrent@example.com", "role": "STUDENT"}, format="json")
        self.invitation_id = result.data["data"]["id"]

    def parallel_posts(self, url, payload, user=None):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        from django.db import connections
        barrier = Barrier(2)

        def post():
            try:
                client = APIClient()
                if user:
                    client.force_authenticate(user)
                barrier.wait(timeout=10)
                return client.post(url, payload, format="json").status_code
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(post) for _ in range(2)]
            return sorted(future.result(timeout=30) for future in futures)

    @patch("users.invitations.send_mail", return_value=1)
    def test_concurrent_approval_sends_once(self, send):
        codes = self.parallel_posts(f"/api/invitations/{self.invitation_id}/approve/", {}, self.admin)
        self.assertEqual(codes, [200, 200])
        self.assertEqual(send.call_count, 1)
        self.assertEqual(Notification.objects.count(), 1)

    def test_concurrent_setup_and_feedback_are_consumed_once(self):
        result = self.client.post(f"/api/invitations/{self.invitation_id}/approve/")
        values = {key: value[0] for key, value in parse_qs(urlsplit(result.data["data"]["setup_link"]).fragment).items()}
        payload = {**values, "password": "Unique-password-849!", "confirm_password": "Unique-password-849!", "gender": "OTHER"}
        self.assertEqual(self.parallel_posts("/api/invitations/accept/", payload), [200, 400])
        user = UserInvitation.objects.get(pk=self.invitation_id).user
        self.assertEqual(self.parallel_posts("/api/feedback/", {"rating": 4, "comments": "Works well"}, user), [201, 400])
        self.assertEqual(InvitationFeedback.objects.count(), 1)
