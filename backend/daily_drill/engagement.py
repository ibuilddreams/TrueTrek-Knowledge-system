"""Task 17 (Phase 5) — Inactivity & Re-engagement.

Inactivity is derived from the exact same activity signal Task 16's streak
is built on (`services.get_last_activity_date`) — a student who has gone
`settings.DAILY_DRILL_INACTIVITY_THRESHOLD_DAYS` consecutive days without a
Daily Drill completion is "inactive". Per the agreed scope for this phase,
being flagged inactive is a soft signal only:

- The student sees it (a banner, via `stats.streak_detail.is_inactive` on
  `GET /daily-drill/today/`) — no functionality is blocked.
- Admins/teachers can see who's inactive (`GET
  /daily-drill/admin/engagement/inactive-students/`) — the full "surface
  disengaged students on a dashboard" experience is Task 19's job (Phase 6),
  this just exposes the data.
- The student gets exactly one re-engagement email when they first cross the
  threshold, then at most one every
  `settings.DAILY_DRILL_REENGAGEMENT_REMINDER_INTERVAL_DAYS` while they
  remain inactive — never once per day.

`evaluate_student_engagement` is idempotent and meant to be called once per
student per day by the `check_student_engagement` management command (there
is no Celery/Redis in this codebase — see ai_courses/services.py for the
same constraint — so this is a cron-driven command, not a background task).
"""

from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import StudentEngagementStatus
from .services import get_last_activity_date


def evaluate_student_engagement(student):
    """Recomputes one student's engagement status from their real activity
    history. Returns (status, became_newly_inactive). Safe to call
    repeatedly — running it twice in a row for the same student is a no-op
    the second time."""
    today = timezone.localdate()
    last_activity = get_last_activity_date(student)

    status, _ = StudentEngagementStatus.objects.get_or_create(student=student)

    if last_activity is None:
        # Never completed a single Daily Drill — nothing to be "inactive"
        # relative to yet, so a brand-new student is never flagged.
        return status, False

    days_since_activity = (today - last_activity).days
    should_be_inactive = days_since_activity >= settings.DAILY_DRILL_INACTIVITY_THRESHOLD_DAYS

    became_newly_inactive = False
    if should_be_inactive and not status.is_inactive:
        status.is_inactive = True
        status.inactive_since = last_activity + timedelta(days=1)
        status.marked_inactive_at = timezone.now()
        status.last_activity_date = last_activity
        status.save()
        became_newly_inactive = True
    elif not should_be_inactive and status.is_inactive:
        # The student came back — clear the flag. A fresh 3-day gap in the
        # future will re-flag them and send a fresh email, not silently stay
        # quiet because they were once already notified.
        status.is_inactive = False
        status.inactive_since = None
        status.reactivated_at = timezone.now()
        status.last_activity_date = last_activity
        status.save()
    elif status.last_activity_date != last_activity:
        status.last_activity_date = last_activity
        status.save(update_fields=["last_activity_date", "updated_at"])

    return status, became_newly_inactive


def is_reminder_due(status):
    if status.last_notified_at is None:
        return True
    days_since_notified = (timezone.now() - status.last_notified_at).days
    return days_since_notified >= settings.DAILY_DRILL_REENGAGEMENT_REMINDER_INTERVAL_DAYS


def send_reengagement_email(student):
    """Fire-and-forget re-engagement notification — matches the
    fail_silently=True convention already used for password-reset email
    (users/services.py) so a broken SMTP config never blocks the management
    command or surfaces an error to anyone."""
    send_mail(
        subject="We miss you at TrueTrek — come back and keep your streak alive",
        message=(
            f"Hi {student.name or student.username},\n\n"
            "We noticed you haven't completed a Daily Drill in a few days and "
            "your streak has reset. Log back in today to pick up where you "
            "left off, rebuild your streak, and keep earning points toward "
            "your rewards.\n\n"
            "See you soon,\nThe TrueTrek Team"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[student.email],
        fail_silently=True,
    )
