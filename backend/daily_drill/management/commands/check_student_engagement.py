from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from daily_drill.engagement import evaluate_student_engagement, is_reminder_due, send_reengagement_email

UserModel = get_user_model()


class Command(BaseCommand):
    help = (
        "Task 17 (Phase 5) — evaluate every student's Daily Drill engagement "
        "status and email a re-engagement notice to anyone newly inactive or "
        "still inactive and due for a reminder. There is no Celery/Redis in "
        "this codebase (see ai_courses for the same constraint), so this is "
        "meant to run once daily via cron/systemd-timer, e.g.: "
        "'0 8 * * * cd /path/to/backend && venv/bin/python manage.py check_student_engagement'."
    )

    def handle(self, *args, **options):
        students = UserModel.objects.filter(
            role=UserModel.Roles.STUDENT, account_status=UserModel.AccountStatus.ACTIVE
        )

        newly_inactive_count = 0
        reminded_count = 0

        for student in students:
            status, became_newly_inactive = evaluate_student_engagement(student)

            if not status.is_inactive:
                continue

            if became_newly_inactive or is_reminder_due(status):
                send_reengagement_email(student)
                status.last_notified_at = timezone.now()
                status.save(update_fields=["last_notified_at", "updated_at"])

                if became_newly_inactive:
                    newly_inactive_count += 1
                else:
                    reminded_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Engagement check complete: {newly_inactive_count} newly inactive, "
                f"{reminded_count} reminder(s) sent to already-inactive students."
            )
        )
