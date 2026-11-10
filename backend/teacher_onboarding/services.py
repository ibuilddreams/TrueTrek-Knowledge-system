"""Application lifecycle: draft -> submitted -> reviewed, and what approval unlocks.

Everything that decides *whether* an account is vetted lives here, so the
permission class, the serializers, the views and `users.SignupSerializer` all
read the same answer rather than each re-deriving it from a status string.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from notifications.services import create_notifications_for_users

from .models import TeacherCredential, TeacherOnboarding

UserModel = get_user_model()

#: How much an applicant has to write before an admin has anything to judge.
#: Short enough to be one honest paragraph, long enough that "I like teaching"
#: doesn't reach the queue.
MIN_BIO_LENGTH = 100
MIN_TEACHING_STATEMENT_LENGTH = 80

MAX_BIO_LENGTH = 4000
MAX_TEACHING_STATEMENT_LENGTH = 2000
MAX_EXPERTISE_ITEMS = 12
MAX_EXPERTISE_LENGTH = 40
MAX_CREDENTIALS = 10


# --------------------------------------------------------------------------
# Who needs reviewing, and who is cleared
# --------------------------------------------------------------------------

def get_onboarding(user):
    """The application for this user, or None if the account never needed one."""
    if not getattr(user, "is_teacher", False):
        return None
    return TeacherOnboarding.objects.filter(user=user).first()


def start_onboarding_for_signup(user):
    """Creates the DRAFT application that makes a self-signed-up teacher
    subject to review. The only caller is `users.SignupSerializer`.

    **This is deliberately the only place a row is ever created.** The
    teacher-facing endpoints look an application up and 404 when there isn't
    one, rather than creating it on demand: `can_teach` reads the row's
    existence as "this account has not been vouched for", so a lazy
    get-or-create would mean a teacher an admin hired being locked out of
    their own courses by the act of opening a screen.
    """
    return TeacherOnboarding.objects.create(
        user=user, status=TeacherOnboarding.ApplicationStatus.DRAFT
    )


def can_teach(user):
    """True when this user may author courses.

    Admins always can. A teacher can unless they hold an application that has
    not been approved — which is to say: having no application at all means an
    admin vouched for the account directly, so nothing is gated.
    """
    if not (user and user.is_authenticated):
        return False
    if user.is_admin:
        return True
    if not user.is_teacher:
        return False

    status = (
        TeacherOnboarding.objects.filter(user=user)
        .values_list("status", flat=True)
        .first()
    )
    return status is None or status == TeacherOnboarding.ApplicationStatus.APPROVED


def access_state(user):
    """The small payload the portal gates on, for any signed-in user.

    Two different questions, deliberately answered separately:

    * `can_access_portal` — may they *see* the Faculty Portal. True unless the
      application is still waiting on them (DRAFT or CHANGES_REQUESTED), in
      which case the wizard takes the screen instead. Once it is submitted
      they are let in and the portal carries a banner saying where the review
      has got to, because parking somebody on a read-only page with nothing to
      do and nowhere to go is not a review step, it is a dead end.
    * `is_approved` — may they actually *do* anything that needs vetting. That
      is what `can_teach` and `IsApprovedTeacher` enforce on the server, and
      seeing the portal has never been what granted it.
    """
    onboarding = get_onboarding(user)
    if onboarding is None:
        return {
            "requires_onboarding": False,
            "status": None,
            "needs_action": False,
            "can_access_portal": True,
            "is_approved": True,
        }
    return {
        "requires_onboarding": True,
        "status": onboarding.status,
        "needs_action": onboarding.is_editable,
        "can_access_portal": not onboarding.is_editable,
        "is_approved": onboarding.is_approved,
    }


# --------------------------------------------------------------------------
# Completeness
# --------------------------------------------------------------------------

def missing_requirements(onboarding):
    """Everything still standing between this application and the queue.

    Returned to the teacher as the review step's checklist *and* used to
    refuse the submit, so the screen can never offer a submit the server
    rejects.
    """
    missing = []

    if not onboarding.headline.strip():
        missing.append("Add a professional headline.")
    if len(onboarding.bio.strip()) < MIN_BIO_LENGTH:
        missing.append(f"Write a bio of at least {MIN_BIO_LENGTH} characters.")
    if not onboarding.highest_qualification:
        missing.append("Choose your highest qualification.")
    if onboarding.years_of_experience is None:
        missing.append("State your years of teaching experience.")
    if not [item for item in onboarding.expertise if str(item).strip()]:
        missing.append("Add at least one subject you can teach.")
    if len(onboarding.teaching_statement.strip()) < MIN_TEACHING_STATEMENT_LENGTH:
        missing.append(
            f"Describe your teaching approach in at least {MIN_TEACHING_STATEMENT_LENGTH} characters."
        )
    if not onboarding.credentials.exists():
        missing.append("Upload at least one qualification document.")
    if not (onboarding.intro_video or onboarding.intro_video_url.strip()):
        missing.append("Add a short intro video — upload a file or paste a link.")

    return missing


def intro_video_display_url(onboarding, request=None):
    """Whichever intro video the teacher actually provided, as something the
    review panel can open — the uploaded file wins, since a link may be to a
    page rather than to a video."""
    if onboarding.intro_video:
        url = onboarding.intro_video.url
        return request.build_absolute_uri(url) if request else url
    return onboarding.intro_video_url or None


# --------------------------------------------------------------------------
# Transitions
# --------------------------------------------------------------------------

@transaction.atomic
def submit_onboarding(onboarding):
    """Moves a complete application into the admin queue and tells the admins.

    Atomic for the same reason `student_concerns.flag_student_concern` is: an
    application must never be sitting in the queue with nobody told about it.
    """
    onboarding.status = TeacherOnboarding.ApplicationStatus.SUBMITTED
    onboarding.step = TeacherOnboarding.Step.REVIEW
    onboarding.submitted_at = timezone.now()
    # A resubmission answers the previous decision, so the old notes stop
    # applying the moment it goes back in the queue.
    onboarding.review_notes = ""
    onboarding.reviewed_at = None
    onboarding.reviewed_by = None
    onboarding.save(
        update_fields=[
            "status",
            "step",
            "submitted_at",
            "review_notes",
            "reviewed_at",
            "reviewed_by",
            "updated_at",
        ]
    )
    _notify_admins_of_submission(onboarding)
    return onboarding


@transaction.atomic
def review_onboarding(onboarding, *, admin, status, notes=""):
    """Records an admin's decision and, on approval, opens the account up."""
    onboarding.status = status
    onboarding.review_notes = notes
    onboarding.reviewed_at = timezone.now()
    onboarding.reviewed_by = admin
    if status == TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED:
        # Send them back to the first step so the application reopens where it
        # is edited rather than on the review screen they just left.
        onboarding.step = TeacherOnboarding.Step.PROFILE
    onboarding.save(
        update_fields=["status", "review_notes", "reviewed_at", "reviewed_by", "step", "updated_at"]
    )

    if onboarding.is_approved:
        apply_to_profiles(onboarding)

    _notify_teacher_of_decision(onboarding)
    return onboarding


def apply_to_profiles(onboarding):
    """Copies the approved application onto the teacher's real profiles.

    **Only fields that are still empty are filled.** The application is a
    snapshot taken at review time, and a teacher who edited their public
    profile while they waited meant that edit — this is a head start on
    filling the profile in, never an overwrite of one.

    An uploaded video deliberately doesn't travel: `InstructorProfile.intro_video_url`
    is a URL field pointing at something hosted, and a path into our own media
    directory is not that. The upload stays on the application, where the
    admin reviewed it.
    """
    from instructors.models import InstructorProfile
    from users.models import UserProfile

    user = onboarding.user

    instructor_profile, _ = InstructorProfile.objects.get_or_create(user=user)
    instructor_updates = {}
    if not instructor_profile.headline and onboarding.headline:
        instructor_updates["headline"] = onboarding.headline
    if not instructor_profile.linkedin_url and onboarding.linkedin_url:
        instructor_updates["linkedin_url"] = onboarding.linkedin_url
    if not instructor_profile.intro_video_url and onboarding.intro_video_url:
        instructor_updates["intro_video_url"] = onboarding.intro_video_url
    if not instructor_profile.skills and onboarding.expertise:
        instructor_updates["skills"] = list(onboarding.expertise)
    if instructor_updates:
        for field, value in instructor_updates.items():
            setattr(instructor_profile, field, value)
        instructor_profile.save(update_fields=list(instructor_updates))

    user_profile, _ = UserProfile.objects.get_or_create(user=user)
    profile_updates = {}
    if not user_profile.bio and onboarding.bio:
        profile_updates["bio"] = onboarding.bio
    if not user_profile.website and onboarding.portfolio_url:
        profile_updates["website"] = onboarding.portfolio_url
    if profile_updates:
        for field, value in profile_updates.items():
            setattr(user_profile, field, value)
        user_profile.save(update_fields=list(profile_updates))

    return instructor_profile


def delete_credential(credential):
    """Removes the row and the file behind it — a teacher deleting a document
    means the document, not just its label."""
    credential.document.delete(save=False)
    credential.delete()


# --------------------------------------------------------------------------
# Telling people
# --------------------------------------------------------------------------

def _notify_admins_of_submission(onboarding):
    admin_ids = UserModel.objects.filter(
        role=UserModel.Roles.ADMIN, account_status=UserModel.AccountStatus.ACTIVE
    ).values_list("id", flat=True)

    create_notifications_for_users(
        admin_ids,
        verb="TEACHER_ONBOARDING_SUBMITTED",
        title=f"Teacher application from {onboarding.user.name or onboarding.user.email}",
        message=(
            f"{onboarding.user.name or onboarding.user.email} submitted a teacher "
            "application for review."
        ),
        related_object_type="teacher_onboarding",
        related_object_id=onboarding.id,
    )


#: Subject + opening line per decision. The teacher reads `review_notes`
#: underneath, which is why none of these three tries to explain the decision
#: itself — the admin already wrote that part.
_DECISION_EMAILS = {
    TeacherOnboarding.ApplicationStatus.APPROVED: (
        "Your Cool Nerds teacher application is approved",
        "Your teacher application has been approved — you can now create and manage courses.",
    ),
    TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED: (
        "Changes requested on your Cool Nerds teacher application",
        "Your teacher application needs a few changes before it can be approved.",
    ),
    TeacherOnboarding.ApplicationStatus.REJECTED: (
        "An update on your Cool Nerds teacher application",
        "Your teacher application was not approved.",
    ),
}


def _notify_teacher_of_decision(onboarding):
    decision = _DECISION_EMAILS.get(onboarding.status)
    if decision is None:
        # UNDER_REVIEW is an admin picking the application up, not a decision;
        # telling the applicant their file was opened is noise.
        return

    subject, opening = decision
    create_notifications_for_users(
        [onboarding.user_id],
        verb=f"TEACHER_ONBOARDING_{onboarding.status}",
        title=subject,
        message=opening,
        related_object_type="teacher_onboarding",
        related_object_id=onboarding.id,
    )

    body = [opening]
    if onboarding.review_notes.strip():
        body.append(f"Notes from the review team:\n{onboarding.review_notes.strip()}")
    body.append(f"Open your portal: {settings.FRONTEND_URL}/teacherportal")

    recipient = onboarding.user.email
    # on_commit so nothing is announced that a later failure rolls back —
    # `class_sessions` mails its recordings the same way.
    transaction.on_commit(
        lambda: send_mail(
            subject=subject,
            message="\n\n".join(body),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )
    )
