"""Admin invitations, NDA approval and authenticated recipient feedback."""
import hashlib
import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from common.pagination import Pagination
from common.response import success_response
from notifications.services import create_notifications_for_users
from .models import CustomUser, InvitationFeedback, UserInvitation
from .permissions import IsAdmin


class InviteInput(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    role = serializers.ChoiceField(choices=["TEACHER", "STUDENT"])
    nda_approved = serializers.BooleanField(default=False)

    def validate_email(self, value):
        value = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise ValidationError("An account or invitation already exists for this email.")
        return value


class FeedbackInput(serializers.ModelSerializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comments = serializers.CharField(max_length=5000)
    suggestions = serializers.CharField(max_length=5000, allow_blank=True, required=False)

    class Meta:
        model = InvitationFeedback
        fields = ["rating", "comments", "suggestions", "submitted_at", "admin_email_status", "admin_email_sent_at"]
        read_only_fields = ["submitted_at", "admin_email_status", "admin_email_sent_at"]


class InvitationSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source="user.email")
    name = serializers.CharField(source="user.name")
    role = serializers.CharField(source="user.role")
    approved_by_name = serializers.CharField(source="nda_approved_by.name", default=None)
    feedback = FeedbackInput(read_only=True)

    class Meta:
        model = UserInvitation
        fields = ["id", "email", "name", "role", "created_at", "nda_approved", "nda_approved_at",
                  "approved_by_name", "accepted_at", "email_status", "email_sent_at", "token_expires_at", "feedback"]


def audit(invitation, admin, action, values):
    AuditLog.objects.create(user=admin, action=action, object_name="UserInvitation",
                            object_id=str(invitation.pk), new_values=values)


def issue_link(invitation):
    token = secrets.token_urlsafe(32)
    invitation.token_hash = hashlib.sha256(token.encode()).hexdigest()
    invitation.token_expires_at = timezone.now() + timedelta(hours=settings.INVITATION_EXPIRY_HOURS)
    invitation.save(update_fields=["token_hash", "token_expires_at"])
    # The secret lives in the URL fragment, which is not sent in HTTP requests/referrers.
    return f"{settings.FRONTEND_URL.rstrip('/')}/accept-invitation#id={invitation.pk}&token={token}"


def send_notification(subject, message, recipient, context):
    # Never report console/file/dummy output as delivered email.
    if settings.EMAIL_BACKEND in {
        "django.core.mail.backends.console.EmailBackend",
        "django.core.mail.backends.filebased.EmailBackend",
        "django.core.mail.backends.dummy.EmailBackend",
    }:
        return "NOT_CONFIGURED"
    if not recipient:
        return "NOT_CONFIGURED"
    try:
        count = send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient],
                          fail_silently=False,
                          html_message=render_to_string("users/notification_email.html", context))
        return "SENT" if count else "FAILED"
    except Exception:
        # Never expose SMTP credentials or discard saved work because mail failed.
        return "FAILED"


def deliver(invitation, link=None):
    issued_token_hash = invitation.token_hash
    name = invitation.user.first_name
    role = invitation.user.role.title()
    if link:
        subject = "Your TrueTrek invitation is approved"
        paragraphs = [f"Hello {name},", f"Your NDA has been approved. You have been invited as a {role}.",
                      "Choose your password using the secure link below.",
                      f"This one-time link expires in {settings.INVITATION_EXPIRY_HOURS} hours. Please keep it private."]
        context = {"heading": "Welcome to TrueTrek", "eyebrow": "NDA approved", "paragraphs": paragraphs,
                   "action_url": link, "action_label": "Set up your account",
                   "secondary_url": f"{settings.FRONTEND_URL.rstrip('/')}/feedback",
                   "secondary_label": "After setup, sign in to share your feedback"}
        message = "\n\n".join(paragraphs) + f"\n\n{link}\n\nAfter setup, sign in to share your feedback:\n{context['secondary_url']}"
    else:
        subject = "You have been invited to TrueTrek"
        paragraphs = [f"Hello {name},", f"You have been invited to join TrueTrek as a {role}.",
                      "Your invitation is pending NDA completion and approval. Please coordinate with your administrator to complete this step.",
                      "Once your NDA is approved, we will send a separate email with your secure account setup link. No account access is available yet."]
        context = {"heading": "You’re invited", "eyebrow": "NDA approval pending", "paragraphs": paragraphs}
        message = "\n\n".join(paragraphs)
    delivery_status = send_notification(subject, message, invitation.user.email, context)
    # A slower send must not overwrite the status of a newer link or a consumed link.
    UserInvitation.objects.filter(pk=invitation.pk, token_hash=issued_token_hash).update(
        email_status=delivery_status,
        email_sent_at=timezone.now() if delivery_status == "SENT" else None,
    )
    invitation.refresh_from_db()


def notify_feedback(feedback_id):
    # Serialize automatic sends and retries. Successful sends are never retried.
    with transaction.atomic():
        feedback = InvitationFeedback.objects.select_for_update().get(pk=feedback_id)
        if feedback.admin_email_status == "SENT":
            return
        user = feedback.invitation.user
        url = f"{settings.FRONTEND_URL.rstrip('/')}/adminportal?tab=invitations"
        paragraphs = [f"{user.name} ({user.email}) has submitted their TrueTrek feedback.",
                      f"Role: {user.role.title()}", f"Rating: {feedback.rating} out of 5",
                      f"Submitted: {feedback.submitted_at:%Y-%m-%d %H:%M %Z}",
                      "Sign in to the admin panel to read their comments and suggestions."]
        feedback.admin_email_status = send_notification(
            f"New TrueTrek feedback from {user.name}", "\n\n".join(paragraphs) + f"\n\n{url}",
            settings.PRAXIN_CLIENT_EMAIL,
            {"heading": "New feedback received", "eyebrow": "Community feedback", "paragraphs": paragraphs,
             "action_url": url, "action_label": "Review feedback"},
        )
        feedback.admin_email_sent_at = timezone.now() if feedback.admin_email_status == "SENT" else None
        feedback.save(update_fields=["admin_email_status", "admin_email_sent_at"])


def approve(invitation, admin):
    if invitation.nda_approved:
        return None
    invitation.nda_approved = True
    invitation.nda_approved_by = admin
    invitation.nda_approved_at = timezone.now()
    invitation.save(update_fields=["nda_approved", "nda_approved_by", "nda_approved_at"])
    audit(invitation, admin, "UPDATE", {"nda_approved": True})
    create_notifications_for_users(
        [invitation.user_id], verb="feedback_available", title="Your feedback form is ready",
        message="Your NDA has been approved. Sign in to share your feedback.", related_object_type="invitation_feedback",
    )
    return issue_link(invitation)


def invitation_result(invitation, link=None):
    data = InvitationSerializer(invitation).data
    if link:
        data["setup_link"] = link
    return data


class PrivateAPIView(APIView):
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response


class InvitationsView(PrivateAPIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        invitations = UserInvitation.objects.select_related("user", "nda_approved_by", "feedback")
        search = request.query_params.get("search", "").strip()
        if search:
            invitations = invitations.filter(Q(user__email__icontains=search) | Q(user__name__icontains=search))
        paginator = Pagination()
        page = paginator.paginate_queryset(invitations, request)
        return success_response(paginator.get_paginated_response(InvitationSerializer(page, many=True).data).data)

    def post(self, request):
        serializer = InviteInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = dict(serializer.validated_data)
        approved = values.pop("nda_approved")
        try:
            with transaction.atomic():
                user = CustomUser.objects.create_user(
                    username=f"invited_{uuid.uuid4().hex}", password=None, gender="OTHER",
                    is_active=False, account_status=CustomUser.AccountStatus.DEACTIVATED, **values,
                )
                invitation = UserInvitation.objects.create(user=user, invited_by=request.user)
                audit(invitation, request.user, "CREATE", {"email": user.email, "role": user.role})
                link = approve(invitation, request.user) if approved else None
        except IntegrityError:
            raise ValidationError("An account or invitation already exists for this email.")
        deliver(invitation, link)
        return success_response(invitation_result(invitation, link), "Invitation created", status_code=201)


class InvitationApproveView(PrivateAPIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        with transaction.atomic():
            invitation = get_object_or_404(UserInvitation.objects.select_for_update(), pk=pk)
            link = approve(invitation, request.user)
        if link:
            deliver(invitation, link)
        return success_response(invitation_result(invitation, link), "NDA approved")


class InvitationLinkView(PrivateAPIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        class LinkInput(serializers.Serializer):
            send_email = serializers.BooleanField(default=False)

        serializer = LinkInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            invitation = get_object_or_404(UserInvitation.objects.select_for_update(), pk=pk)
            if not invitation.nda_approved or invitation.accepted_at:
                raise ValidationError("Links are available only for approved invitations awaiting account setup.")
            link = issue_link(invitation)
            invitation.email_status = "NOT_SENT"
            invitation.email_sent_at = None
            invitation.save(update_fields=["email_status", "email_sent_at"])
            audit(invitation, request.user, "UPDATE", {"setup_link_regenerated": True})
        if serializer.validated_data["send_email"]:
            deliver(invitation, link)
        return success_response(invitation_result(invitation, link), "New link created; previous links are invalid")


class SetupThrottle(AnonRateThrottle):
    rate = "20/hour"


class InvitationAcceptView(PrivateAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [SetupThrottle]

    def post(self, request):
        class SetupInput(serializers.Serializer):
            id = serializers.UUIDField()
            token = serializers.CharField(max_length=128)
            password = serializers.CharField(max_length=128, trim_whitespace=False)
            confirm_password = serializers.CharField(max_length=128, trim_whitespace=False)
            gender = serializers.ChoiceField(choices=CustomUser.Gender.choices)

        serializer = SetupInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        with transaction.atomic():
            invitation = UserInvitation.objects.select_for_update().filter(pk=values["id"]).first()
            if (not invitation or not invitation.nda_approved or invitation.accepted_at
                    or not invitation.token_expires_at or invitation.token_expires_at <= timezone.now()
                    or not secrets.compare_digest(invitation.token_hash, hashlib.sha256(values["token"].encode()).hexdigest())):
                raise ValidationError("This invitation is invalid or has expired. Ask your admin for a new link.")
            if values["password"] != values["confirm_password"]:
                raise ValidationError({"confirm_password": "Passwords do not match."})
            user = CustomUser.objects.select_for_update().get(pk=invitation.user_id)
            try:
                validate_password(values["password"], user=user)
            except DjangoValidationError as exc:
                raise ValidationError({"password": exc.messages})
            user.set_password(values["password"])
            user.gender = values["gender"]
            user.is_active = True
            user.account_status = CustomUser.AccountStatus.ACTIVE
            user.is_verified = True
            user.save(update_fields=["password", "gender", "is_active", "account_status", "is_verified"])
            invitation.accepted_at = timezone.now()
            invitation.token_hash = ""
            invitation.save(update_fields=["accepted_at", "token_hash"])
            audit(invitation, user, "UPDATE", {"account_setup_completed": True})
        return success_response(None, "Your account is ready. Sign in to complete your feedback form.")


def eligible_invitation(user, lock=False):
    query = UserInvitation.objects.select_for_update() if lock else UserInvitation.objects
    return query.filter(user=user, nda_approved=True, accepted_at__isnull=False,
                        user__is_active=True, user__account_status="ACTIVE",
                        user__role__in=["TEACHER", "STUDENT"]).first()


class FeedbackStatusView(PrivateAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitation = eligible_invitation(request.user)
        return success_response({"eligible": bool(invitation), "submitted": bool(
            invitation and InvitationFeedback.objects.filter(invitation=invitation).exists())})


class FeedbackView(PrivateAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitation = eligible_invitation(request.user)
        if not invitation:
            raise PermissionDenied("Feedback is available only to invited users with an approved NDA and completed account setup.")
        response = InvitationFeedback.objects.filter(invitation=invitation).first()
        return success_response({"response": FeedbackInput(response).data if response else None})

    def post(self, request):
        with transaction.atomic():
            invitation = eligible_invitation(request.user, lock=True)
            if not invitation:
                raise PermissionDenied("You are not eligible to submit this feedback form.")
            if InvitationFeedback.objects.filter(invitation=invitation).exists():
                raise ValidationError("You have already submitted your feedback.")
            serializer = FeedbackInput(data=request.data)
            serializer.is_valid(raise_exception=True)
            feedback = serializer.save(invitation=invitation)
            transaction.on_commit(lambda: notify_feedback(feedback.pk))
        return success_response(serializer.data, "Thank you for your feedback", status_code=201)


class FeedbackEmailRetryView(PrivateAPIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        feedback = get_object_or_404(InvitationFeedback, invitation_id=pk)
        notify_feedback(feedback.pk)
        feedback.refresh_from_db()
        return success_response(FeedbackInput(feedback).data, "Notification delivery checked")


class InvitationEmailRetryView(PrivateAPIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        with transaction.atomic():
            invitation = get_object_or_404(UserInvitation.objects.select_for_update(), pk=pk)
            if invitation.nda_approved:
                raise ValidationError("Use a new setup link for an approved invitation.")
            if invitation.email_status != "SENT":
                deliver(invitation)
        return success_response(invitation_result(invitation), "Invitation delivery checked")
