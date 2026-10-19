from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from ..exceptions import SessionClosedError, SessionFullError, SessionNotJoinableError
from ..models import LiveSession, SessionRSVP
from ..services import (
    ENDED,
    LIVE,
    UPCOMING,
    cancel_rsvp,
    get_join_url,
    get_session_stats,
    live_state,
    past_sessions,
    rsvp_to_session,
    upcoming_sessions,
)

UserModel = get_user_model()


def make_student(username="session-student"):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


def make_session(*, starts_in_minutes=60, duration=60, **kwargs):
    kwargs.setdefault("title", "Building Your Brand in High School")
    kwargs.setdefault("meeting_url", "https://zoom.us/j/123456")
    return LiveSession.objects.create(
        scheduled_at=timezone.now() + timedelta(minutes=starts_in_minutes),
        duration_minutes=duration,
        **kwargs,
    )


class LiveStateTests(TestCase):
    def test_a_session_an_hour_out_is_upcoming(self):
        self.assertEqual(live_state(make_session(starts_in_minutes=60)), UPCOMING)

    def test_a_session_in_progress_is_live(self):
        self.assertEqual(live_state(make_session(starts_in_minutes=-10)), LIVE)

    def test_the_room_opens_before_the_advertised_start(self):
        # Starts in 10 minutes — inside the 15-minute early-entry window, so
        # the doors are already open even though the clock hasn't hit start.
        self.assertEqual(live_state(make_session(starts_in_minutes=10)), LIVE)
        # 20 minutes out is still outside it.
        self.assertEqual(live_state(make_session(starts_in_minutes=20)), UPCOMING)

    def test_a_finished_session_is_ended(self):
        self.assertEqual(live_state(make_session(starts_in_minutes=-180, duration=60)), ENDED)

    def test_cancelled_beats_the_clock(self):
        session = make_session(starts_in_minutes=-10, status=LiveSession.SessionStatus.CANCELLED)
        self.assertEqual(live_state(session), "CANCELLED")


class SessionListTests(TestCase):
    def test_a_live_session_is_listed_as_upcoming_not_past(self):
        live = make_session(starts_in_minutes=-10)
        make_session(starts_in_minutes=-600, title="Last month")

        self.assertIn(live.pk, [s.pk for s in upcoming_sessions()])
        self.assertNotIn(live.pk, [s.pk for s in past_sessions()])

    def test_a_long_session_in_progress_stays_in_upcoming(self):
        """Regression: splitting the lists on `scheduled_at` alone dropped a
        still-live long session into "past" 15 minutes after it started,
        disagreeing with live_state()."""
        long_session = make_session(starts_in_minutes=-20, duration=90)
        self.assertEqual(live_state(long_session), LIVE)

        self.assertIn(long_session.pk, [s.pk for s in upcoming_sessions()])
        self.assertNotIn(long_session.pk, [s.pk for s in past_sessions()])

    def test_a_session_moves_to_past_once_it_actually_ends(self):
        finished = make_session(starts_in_minutes=-200, duration=90)
        self.assertEqual(live_state(finished), ENDED)

        self.assertIn(finished.pk, [s.pk for s in past_sessions()])
        self.assertNotIn(finished.pk, [s.pk for s in upcoming_sessions()])

    def test_past_sessions_include_cancelled_ones(self):
        cancelled = make_session(starts_in_minutes=120, status=LiveSession.SessionStatus.CANCELLED)
        self.assertIn(cancelled.pk, [s.pk for s in past_sessions()])
        self.assertNotIn(cancelled.pk, [s.pk for s in upcoming_sessions()])


class RSVPTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.session = make_session()

    def test_rsvp_creates_a_single_row_and_is_idempotent(self):
        first = rsvp_to_session(session=self.session, student=self.student)
        second = rsvp_to_session(session=self.session, student=self.student)

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(SessionRSVP.objects.filter(session=self.session).count(), 1)

    def test_capacity_is_enforced(self):
        session = make_session(capacity=1)
        rsvp_to_session(session=session, student=self.student)

        with self.assertRaises(SessionFullError):
            rsvp_to_session(session=session, student=make_student("second"))

    def test_an_existing_rsvp_still_works_when_the_session_is_full(self):
        session = make_session(capacity=1)
        rsvp_to_session(session=session, student=self.student)
        # Re-RSVPing must not be rejected for capacity — the seat is already theirs.
        self.assertIsNotNone(rsvp_to_session(session=session, student=self.student))

    def test_cannot_rsvp_to_a_finished_session(self):
        finished = make_session(starts_in_minutes=-300, duration=60)
        with self.assertRaises(SessionClosedError):
            rsvp_to_session(session=finished, student=self.student)

    def test_cannot_rsvp_to_a_cancelled_session(self):
        cancelled = make_session(status=LiveSession.SessionStatus.CANCELLED)
        with self.assertRaises(SessionClosedError):
            rsvp_to_session(session=cancelled, student=self.student)

    def test_cancel_rsvp_frees_the_seat(self):
        session = make_session(capacity=1)
        rsvp_to_session(session=session, student=self.student)

        self.assertTrue(cancel_rsvp(session=session, student=self.student))
        self.assertFalse(SessionRSVP.objects.filter(session=session).exists())
        # The freed seat is usable by someone else.
        rsvp_to_session(session=session, student=make_student("third"))


class JoinLinkTests(TestCase):
    def setUp(self):
        self.student = make_student()

    def test_link_is_withheld_before_the_room_opens(self):
        session = make_session(starts_in_minutes=120)
        with self.assertRaises(SessionNotJoinableError):
            get_join_url(session=session, student=self.student)

    def test_link_is_released_while_live(self):
        session = make_session(starts_in_minutes=-5)
        self.assertEqual(get_join_url(session=session, student=self.student), session.meeting_url)

    def test_joining_records_attendance_even_without_a_prior_rsvp(self):
        session = make_session(starts_in_minutes=-5)
        get_join_url(session=session, student=self.student)

        rsvp = SessionRSVP.objects.get(session=session, student=self.student)
        self.assertTrue(rsvp.attended)
        self.assertIsNotNone(rsvp.joined_at)

    def test_the_too_early_message_never_quotes_a_timezone(self):
        """The message is shown verbatim to a student. The server only knows
        UTC, while every time the frontend renders is in the viewer's own
        timezone — quoting one here contradicted the clock beside it."""
        session = make_session(starts_in_minutes=120)

        with self.assertRaises(SessionNotJoinableError) as ctx:
            get_join_url(session=session, student=self.student)

        message = str(ctx.exception)
        self.assertIn("15 minutes before", message)
        self.assertNotIn("UTC", message)

    def test_link_is_withheld_after_the_session_ends(self):
        session = make_session(starts_in_minutes=-300, duration=60)
        with self.assertRaises(SessionNotJoinableError):
            get_join_url(session=session, student=self.student)

    def test_a_session_with_no_link_cannot_be_joined(self):
        session = make_session(starts_in_minutes=-5, meeting_url=None)
        with self.assertRaises(SessionNotJoinableError):
            get_join_url(session=session, student=self.student)

    def test_a_cancelled_session_cannot_be_joined(self):
        session = make_session(starts_in_minutes=-5, status=LiveSession.SessionStatus.CANCELLED)
        with self.assertRaises(SessionNotJoinableError):
            get_join_url(session=session, student=self.student)


class SessionStatsTests(TestCase):
    def test_counts_upcoming_rsvps_attendance_and_recordings(self):
        student = make_student()
        upcoming = make_session(starts_in_minutes=120)
        make_session(starts_in_minutes=-600, title="Recorded", recording_url="https://example.com/r")

        rsvp_to_session(session=upcoming, student=student)
        live = make_session(starts_in_minutes=-5, title="Live now")
        get_join_url(session=live, student=student)

        stats = get_session_stats(student)

        self.assertEqual(stats["upcoming_count"], 2)  # the 2h-out one and the live one
        self.assertEqual(stats["my_rsvp_count"], 2)
        self.assertEqual(stats["sessions_attended"], 1)
        self.assertEqual(stats["recordings_available"], 1)
