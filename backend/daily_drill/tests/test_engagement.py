from datetime import date, timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.test import APITestCase

from ..engagement import evaluate_student_engagement, is_reminder_due
from ..models import DrillAttempt, DrillOption, DrillQuestion, StudentEngagementStatus
from ..services import get_streak_calendar, get_streak_status

UserModel = get_user_model()


def _make_student(username):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


def _make_attempt(student, question, option, days_ago):
    return DrillAttempt.objects.create(
        student=student,
        question=question,
        selected_option=option,
        attempt_date=timezone.localdate() - timedelta(days=days_ago),
        score_awarded=option.score,
        xp_earned=option.score,
    )


class StreakStatusTests(TestCase):
    """Task 16 (Phase 5) — get_streak_status's named status and calendar."""

    def setUp(self):
        self.student = _make_student("streakstatusstudent")
        self.question = DrillQuestion.objects.create(scenario="S", guidelines="G")
        self.option = DrillOption.objects.create(
            question=self.question, key="A", text="T", impact="I", rationale="R", score=100
        )

    def test_new_student_has_new_status(self):
        status = get_streak_status(self.student)

        self.assertEqual(status["status"], "NEW")
        self.assertEqual(status["current_streak"], 0)
        self.assertIsNone(status["last_activity_date"])
        self.assertFalse(status["is_inactive"])

    def test_active_today_has_active_status(self):
        _make_attempt(self.student, self.question, self.option, days_ago=0)

        status = get_streak_status(self.student)

        self.assertEqual(status["status"], "ACTIVE")
        self.assertEqual(status["current_streak"], 1)
        self.assertFalse(status["is_inactive"])

    def test_missed_only_today_is_at_risk_not_broken(self):
        _make_attempt(self.student, self.question, self.option, days_ago=1)

        status = get_streak_status(self.student)

        self.assertEqual(status["status"], "AT_RISK")
        self.assertEqual(status["current_streak"], 1)
        self.assertFalse(status["is_inactive"])

    def test_three_missed_days_is_broken_and_inactive(self):
        _make_attempt(self.student, self.question, self.option, days_ago=3)

        status = get_streak_status(self.student)

        self.assertEqual(status["status"], "BROKEN")
        self.assertEqual(status["current_streak"], 0)
        self.assertEqual(status["days_since_activity"], 3)
        self.assertTrue(status["is_inactive"])

    def test_longest_streak_survives_a_break(self):
        for days_ago in (10, 9, 8, 0):
            _make_attempt(self.student, self.question, self.option, days_ago=days_ago)

        status = get_streak_status(self.student)

        self.assertEqual(status["longest_streak"], 3)
        self.assertEqual(status["current_streak"], 1)


class StreakCalendarTests(TestCase):
    """Task 16 (Phase 5) follow-up — the full year-long, GitHub-style
    activity grid backing the dedicated Streak page."""

    def setUp(self):
        self.student = _make_student("calendarstudent")
        self.question = DrillQuestion.objects.create(scenario="S", guidelines="G")
        self.option = DrillOption.objects.create(
            question=self.question, key="A", text="T", impact="I", rationale="R", score=100
        )

    def test_grid_always_starts_on_a_sunday_and_ends_today(self):
        calendar = get_streak_calendar(self.student, days=365)

        start = date.fromisoformat(calendar["start_date"])
        self.assertEqual(start.isoweekday() % 7, 0, "start_date must be a Sunday")
        self.assertEqual(calendar["end_date"], timezone.localdate().isoformat())
        self.assertEqual(calendar["days"][0]["date"], calendar["start_date"])
        self.assertEqual(calendar["days"][-1]["date"], calendar["end_date"])

    def test_every_week_column_starts_on_a_sunday(self):
        # The grid starts on a Sunday but ends on "today" (not necessarily a
        # Saturday), so the final 7-day chunk is naturally partial — same as
        # GitHub's own contribution graph. What must hold is that every
        # 7-day chunk starting at index 0 begins on a Sunday, so the
        # frontend can lay this out in fixed weekly columns with zero
        # date-of-week math of its own.
        calendar = get_streak_calendar(self.student, days=365)

        for week_start_index in range(0, len(calendar["days"]), 7):
            self.assertEqual(calendar["days"][week_start_index]["weekday"], 0)

    def test_completed_dates_are_marked_true(self):
        _make_attempt(self.student, self.question, self.option, days_ago=0)
        _make_attempt(self.student, self.question, self.option, days_ago=1)

        calendar = get_streak_calendar(self.student, days=365)
        completed_by_date = {day["date"]: day["completed"] for day in calendar["days"]}

        self.assertTrue(completed_by_date[timezone.localdate().isoformat()])
        self.assertTrue(completed_by_date[(timezone.localdate() - timedelta(days=1)).isoformat()])
        self.assertFalse(completed_by_date[(timezone.localdate() - timedelta(days=2)).isoformat()])

    def test_total_active_days_counts_only_completed_days(self):
        for days_ago in (0, 1, 2):
            _make_attempt(self.student, self.question, self.option, days_ago=days_ago)

        calendar = get_streak_calendar(self.student, days=365)

        self.assertEqual(calendar["total_active_days"], 3)

    def test_streak_values_match_get_streak_status(self):
        for days_ago in (0, 1, 2):
            _make_attempt(self.student, self.question, self.option, days_ago=days_ago)

        calendar = get_streak_calendar(self.student, days=365)
        status = get_streak_status(self.student)

        self.assertEqual(calendar["current_streak"], status["current_streak"])
        self.assertEqual(calendar["longest_streak"], status["longest_streak"])

    def test_empty_history_still_returns_a_full_valid_grid(self):
        calendar = get_streak_calendar(self.student, days=365)

        self.assertEqual(calendar["total_active_days"], 0)
        self.assertTrue(all(not day["completed"] for day in calendar["days"]))


class StreakCalendarViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("daily-drill-streak-calendar")
        self.student = _make_student("calendarviewstudent")
        self.teacher = UserModel.objects.create_user(
            username="calendarviewteacher",
            email="calendarviewteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_student(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, http_status.HTTP_403_FORBIDDEN)

    def test_returns_calendar_for_authenticated_student(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        data = response.data["data"]
        self.assertIn("days", data)
        self.assertIn("current_streak", data)
        self.assertIn("longest_streak", data)
        self.assertIn("total_active_days", data)


class EvaluateStudentEngagementTests(TestCase):
    """Task 17 (Phase 5) — evaluate_student_engagement's persisted flag."""

    def setUp(self):
        self.student = _make_student("engagementstudent")
        self.question = DrillQuestion.objects.create(scenario="S", guidelines="G")
        self.option = DrillOption.objects.create(
            question=self.question, key="A", text="T", impact="I", rationale="R", score=100
        )

    def test_never_active_student_is_not_flagged(self):
        status, became_newly_inactive = evaluate_student_engagement(self.student)

        self.assertFalse(status.is_inactive)
        self.assertFalse(became_newly_inactive)

    def test_three_days_inactive_flags_the_student(self):
        _make_attempt(self.student, self.question, self.option, days_ago=3)

        status, became_newly_inactive = evaluate_student_engagement(self.student)

        self.assertTrue(status.is_inactive)
        self.assertTrue(became_newly_inactive)
        self.assertIsNotNone(status.marked_inactive_at)

    def test_re_evaluating_an_already_inactive_student_is_not_newly_inactive_again(self):
        _make_attempt(self.student, self.question, self.option, days_ago=5)
        evaluate_student_engagement(self.student)

        status, became_newly_inactive = evaluate_student_engagement(self.student)

        self.assertTrue(status.is_inactive)
        self.assertFalse(became_newly_inactive)

    def test_returning_student_is_reactivated(self):
        _make_attempt(self.student, self.question, self.option, days_ago=5)
        evaluate_student_engagement(self.student)

        _make_attempt(self.student, self.question, self.option, days_ago=0)
        status, became_newly_inactive = evaluate_student_engagement(self.student)

        self.assertFalse(status.is_inactive)
        self.assertFalse(became_newly_inactive)
        self.assertIsNotNone(status.reactivated_at)

    def test_is_reminder_due_when_never_notified(self):
        status = StudentEngagementStatus.objects.create(student=self.student, is_inactive=True)

        self.assertTrue(is_reminder_due(status))

    @override_settings(DAILY_DRILL_REENGAGEMENT_REMINDER_INTERVAL_DAYS=7)
    def test_is_reminder_due_respects_the_interval(self):
        status = StudentEngagementStatus.objects.create(
            student=self.student, is_inactive=True, last_notified_at=timezone.now()
        )

        self.assertFalse(is_reminder_due(status))

        status.last_notified_at = timezone.now() - timedelta(days=8)
        status.save()

        self.assertTrue(is_reminder_due(status))


class CheckStudentEngagementCommandTests(TestCase):
    """Task 17 (Phase 5) — the daily cron entry point end to end."""

    def setUp(self):
        self.question = DrillQuestion.objects.create(scenario="S", guidelines="G")
        self.option = DrillOption.objects.create(
            question=self.question, key="A", text="T", impact="I", rationale="R", score=100
        )

    def test_newly_inactive_student_gets_exactly_one_email(self):
        student = _make_student("cronstudent")
        _make_attempt(student, self.question, self.option, days_ago=3)

        call_command("check_student_engagement", stdout=StringIO())

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [student.email])
        status = StudentEngagementStatus.objects.get(student=student)
        self.assertTrue(status.is_inactive)
        self.assertIsNotNone(status.last_notified_at)

    def test_already_notified_student_is_not_re_emailed_immediately(self):
        student = _make_student("cronstudent2")
        _make_attempt(student, self.question, self.option, days_ago=3)

        call_command("check_student_engagement", stdout=StringIO())
        mail.outbox.clear()
        call_command("check_student_engagement", stdout=StringIO())

        self.assertEqual(len(mail.outbox), 0)

    def test_active_student_never_gets_an_email(self):
        student = _make_student("cronstudent3")
        _make_attempt(student, self.question, self.option, days_ago=0)

        call_command("check_student_engagement", stdout=StringIO())

        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(StudentEngagementStatus.objects.filter(student=student, is_inactive=True).exists())

    def test_deactivated_account_is_skipped(self):
        student = _make_student("cronstudent4")
        student.account_status = UserModel.AccountStatus.DEACTIVATED
        student.save(update_fields=["account_status"])
        _make_attempt(student, self.question, self.option, days_ago=5)

        call_command("check_student_engagement", stdout=StringIO())

        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(StudentEngagementStatus.objects.filter(student=student).exists())


class InactiveStudentsListViewTests(APITestCase):
    """Task 17 (Phase 5) — admin-only visibility into flagged students."""

    def setUp(self):
        self.url = reverse("daily-drill-admin-inactive-students")
        self.admin = UserModel.objects.create_user(
            username="engagementadmin",
            email="engagementadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )
        self.student = _make_student("inactivelisted")
        self.active_student = _make_student("activelisted")
        StudentEngagementStatus.objects.create(
            student=self.student,
            is_inactive=True,
            last_activity_date=timezone.localdate() - timedelta(days=5),
            marked_inactive_at=timezone.now(),
        )
        StudentEngagementStatus.objects.create(student=self.active_student, is_inactive=False)

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_admin(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, http_status.HTTP_403_FORBIDDEN)

    def test_lists_only_inactive_students(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["student_id"], self.student.id)
        self.assertEqual(results[0]["days_inactive"], 5)
