from datetime import timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone

from enrollments.models import Enrollment
from notifications.models import Notification

from ..agora import decode_rtc_token
from ..exceptions import (
    AgoraNotConfiguredError,
    SessionAccessDeniedError,
    SessionNotJoinableError,
    SessionScheduleError,
    WhiteboardNotConfiguredError,
)
from ..models import ClassSession, ClassSessionAttendance
from ..services import (
    CANCELLED,
    ENDED,
    LIVE,
    UPCOMING,
    can_attend,
    can_join_now,
    can_manage,
    cancel_class,
    get_roster,
    is_whiteboard_configured,
    issue_join_credentials,
    issue_whiteboard_credentials,
    live_state,
    past,
    record_leave,
    schedule_class,
    set_whiteboard_access,
    student_sessions,
    teacher_sessions,
    upcoming,
    update_class,
)
from ..whiteboard import decode_token
from .factories import assign_teacher, enrol, make_course, make_session, make_user

UserModel = get_user_model()

APP_ID = "2f0e20ac920f4bcdb342451a6653358e"
APP_CERTIFICATE = "9b86a609600d427cbe3cd2f7dd6e4a93"

agora_configured = override_settings(
    AGORA_APP_ID=APP_ID, AGORA_APP_CERTIFICATE=APP_CERTIFICATE
)


class ClassroomTestCase(TestCase):
    def setUp(self):
        self.teacher = make_user("classteacher", UserModel.Roles.TEACHER)
        self.other_teacher = make_user("otherteacher", UserModel.Roles.TEACHER)
        self.student = make_user("classstudent", UserModel.Roles.STUDENT)
        self.outsider = make_user("outsider", UserModel.Roles.STUDENT)
        self.admin = make_user("classadmin", UserModel.Roles.ADMIN)

        self.course = make_course()
        assign_teacher(self.course, self.teacher)
        enrol(self.course, self.student)

        self.session = make_session(course=self.course, teacher=self.teacher)


class LiveStateTests(ClassroomTestCase):
    def test_a_class_an_hour_out_is_upcoming(self):
        self.assertEqual(live_state(self.session), UPCOMING)

    def test_a_class_in_progress_is_live(self):
        self.assertEqual(
            live_state(make_session(course=self.course, teacher=self.teacher, starts_in_minutes=-10)),
            LIVE,
        )

    def test_the_room_opens_before_the_advertised_start(self):
        soon = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=10)
        self.assertEqual(live_state(soon), LIVE)

    def test_a_finished_class_has_ended(self):
        finished = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-180, duration=60
        )
        self.assertEqual(live_state(finished), ENDED)

    def test_cancelled_beats_the_clock(self):
        self.session.status = ClassSession.SessionStatus.CANCELLED
        self.assertEqual(live_state(self.session), CANCELLED)

    def test_the_host_door_opens_earlier_than_the_students(self):
        # 30 minutes out: inside the teacher's hour, outside the student's
        # quarter hour. The same class, the same moment, two answers.
        session = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=30)
        self.assertTrue(can_join_now(session, self.teacher))
        self.assertFalse(can_join_now(session, self.student))

    def test_nobody_joins_a_cancelled_class(self):
        session = make_session(
            course=self.course,
            teacher=self.teacher,
            starts_in_minutes=-5,
            status=ClassSession.SessionStatus.CANCELLED,
        )
        self.assertFalse(can_join_now(session, self.teacher))
        self.assertFalse(can_join_now(session, self.student))


class MembershipTests(ClassroomTestCase):
    def test_the_courses_teacher_hosts_and_manages(self):
        self.assertTrue(can_manage(self.teacher, self.session))
        self.assertTrue(can_attend(self.teacher, self.session))

    def test_a_co_instructor_can_manage_a_colleagues_class(self):
        assign_teacher(self.course, self.other_teacher)
        self.assertTrue(can_manage(self.other_teacher, self.session))

    def test_a_teacher_of_another_course_cannot(self):
        self.assertFalse(can_manage(self.other_teacher, self.session))
        self.assertFalse(can_attend(self.other_teacher, self.session))

    def test_an_enrolled_student_attends_but_does_not_manage(self):
        self.assertTrue(can_attend(self.student, self.session))
        self.assertFalse(can_manage(self.student, self.session))

    def test_an_unenrolled_student_is_not_in_the_class(self):
        self.assertFalse(can_attend(self.outsider, self.session))

    def test_a_cancelled_enrolment_loses_access(self):
        enrolment = Enrollment.objects.get(course=self.course, student=self.student)
        enrolment.status = Enrollment.EnrollmentStatus.CANCELLED
        enrolment.save()
        self.assertFalse(can_attend(self.student, self.session))

    def test_an_admin_can_sit_in(self):
        self.assertTrue(can_manage(self.admin, self.session))
        self.assertTrue(can_attend(self.admin, self.session))

    def test_the_roster_maps_uids_to_names_without_leaking_emails(self):
        roster = get_roster(self.session)
        by_uid = {entry["uid"]: entry for entry in roster}

        self.assertEqual(by_uid[self.teacher.pk]["role"], "HOST")
        self.assertEqual(by_uid[self.student.pk]["role"], "STUDENT")
        self.assertNotIn(self.outsider.pk, by_uid)
        self.assertNotIn("email", roster[0])


class ListingTests(ClassroomTestCase):
    def test_a_live_class_is_listed_as_upcoming_not_past(self):
        live = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=-10)
        make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-600, title="Last week"
        )

        upcoming_ids = set(upcoming(teacher_sessions(self.teacher)).values_list("id", flat=True))
        past_ids = set(past(teacher_sessions(self.teacher)).values_list("id", flat=True))

        self.assertIn(live.pk, upcoming_ids)
        self.assertNotIn(live.pk, past_ids)

    def test_a_cancelled_class_stays_visible_in_past(self):
        cancel_class(self.session, "Snow day")
        past_ids = set(past(student_sessions(self.student)).values_list("id", flat=True))
        self.assertIn(self.session.pk, past_ids)

    def test_a_student_only_sees_classes_on_courses_they_are_enrolled_in(self):
        other_course = make_course(code="BRD-201", title="Brand Building")
        assign_teacher(other_course, self.other_teacher)
        hidden = make_session(course=other_course, teacher=self.other_teacher)

        visible = set(student_sessions(self.student).values_list("id", flat=True))
        self.assertIn(self.session.pk, visible)
        self.assertNotIn(hidden.pk, visible)


class SchedulingTests(ClassroomTestCase):
    def test_scheduling_notifies_every_enrolled_student(self):
        Notification.objects.all().delete()

        session = schedule_class(
            teacher=self.teacher,
            course=self.course,
            title="Contract Basics",
            scheduled_at=timezone.now() + timedelta(days=1),
            duration_minutes=45,
        )

        notifications = Notification.objects.filter(verb="class_scheduled")
        self.assertEqual([n.recipient_id for n in notifications], [self.student.pk])
        self.assertEqual(notifications.first().related_object_id, session.pk)

    def test_a_teacher_cannot_schedule_on_a_course_they_do_not_teach(self):
        with self.assertRaises(SessionScheduleError):
            schedule_class(
                teacher=self.other_teacher,
                course=self.course,
                title="Not mine",
                scheduled_at=timezone.now() + timedelta(days=1),
                duration_minutes=60,
            )

    def test_a_teacher_cannot_double_book_themselves(self):
        start = timezone.now() + timedelta(days=2)
        schedule_class(
            teacher=self.teacher,
            course=self.course,
            title="First",
            scheduled_at=start,
            duration_minutes=60,
        )

        with self.assertRaises(SessionScheduleError):
            schedule_class(
                teacher=self.teacher,
                course=self.course,
                title="Overlaps by half an hour",
                scheduled_at=start + timedelta(minutes=30),
                duration_minutes=60,
            )

    def test_back_to_back_classes_are_fine(self):
        start = timezone.now() + timedelta(days=2)
        schedule_class(
            teacher=self.teacher,
            course=self.course,
            title="First",
            scheduled_at=start,
            duration_minutes=60,
        )
        schedule_class(
            teacher=self.teacher,
            course=self.course,
            title="Second",
            scheduled_at=start + timedelta(minutes=60),
            duration_minutes=60,
        )
        self.assertEqual(ClassSession.objects.filter(teacher=self.teacher).count(), 3)

    def test_two_teachers_may_run_parallel_classes(self):
        assign_teacher(self.course, self.other_teacher)
        start = timezone.now() + timedelta(days=3)
        schedule_class(
            teacher=self.teacher, course=self.course, title="A", scheduled_at=start,
            duration_minutes=60,
        )
        schedule_class(
            teacher=self.other_teacher, course=self.course, title="B", scheduled_at=start,
            duration_minutes=60,
        )
        self.assertEqual(ClassSession.objects.filter(scheduled_at=start).count(), 2)

    def test_every_class_gets_its_own_channel(self):
        second = make_session(course=self.course, teacher=self.teacher, title="Second")
        self.assertNotEqual(self.session.channel_name, second.channel_name)
        self.assertTrue(self.session.channel_name.startswith("cls-"))

    def test_moving_the_time_tells_the_students(self):
        Notification.objects.all().delete()
        update_class(self.session, scheduled_at=timezone.now() + timedelta(days=5))
        self.assertTrue(Notification.objects.filter(verb="class_rescheduled").exists())

    def test_fixing_a_typo_does_not_tell_the_students(self):
        Notification.objects.all().delete()
        update_class(self.session, title="Film Review: Week 4 (corrected)")
        self.assertFalse(Notification.objects.exists())

    def test_cancelling_tells_the_students_why(self):
        Notification.objects.all().delete()
        cancel_class(self.session, "Coach is travelling")

        self.session.refresh_from_db()
        self.assertEqual(self.session.status, ClassSession.SessionStatus.CANCELLED)
        notification = Notification.objects.get(verb="class_cancelled")
        self.assertEqual(notification.message, "Coach is travelling")


@agora_configured
class JoinCredentialTests(ClassroomTestCase):
    def setUp(self):
        super().setUp()
        # A class that started ten minutes ago: live for everyone.
        self.live_session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-10, title="Live now"
        )

    def test_a_student_gets_a_token_bound_to_the_channel_and_to_themselves(self):
        credentials = issue_join_credentials(session=self.live_session, user=self.student)

        decoded = decode_rtc_token(credentials["token"], APP_CERTIFICATE)
        self.assertTrue(decoded["signature_valid"])
        self.assertEqual(decoded["app_id"], APP_ID)
        self.assertEqual(decoded["channel_name"], self.live_session.channel_name)
        self.assertEqual(decoded["uid"], self.student.pk)
        self.assertEqual(credentials["uid"], self.student.pk)
        self.assertEqual(credentials["role"], "STUDENT")

    def test_the_teacher_joins_as_host(self):
        credentials = issue_join_credentials(session=self.live_session, user=self.teacher)
        self.assertEqual(credentials["role"], "HOST")

    def test_an_unenrolled_student_is_refused(self):
        with self.assertRaises(SessionAccessDeniedError):
            issue_join_credentials(session=self.live_session, user=self.outsider)

    def test_a_student_cannot_get_a_token_before_the_room_opens(self):
        early = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=45)
        with self.assertRaises(SessionNotJoinableError):
            issue_join_credentials(session=early, user=self.student)

    def test_the_teacher_can_open_the_room_early(self):
        early = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=45)
        self.assertTrue(issue_join_credentials(session=early, user=self.teacher)["token"])

    def test_nobody_can_join_a_finished_class(self):
        finished = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-300, duration=60
        )
        with self.assertRaises(SessionNotJoinableError):
            issue_join_credentials(session=finished, user=self.teacher)

    def test_nobody_can_join_a_cancelled_class(self):
        cancel_class(self.live_session, "Called off")
        with self.assertRaises(SessionNotJoinableError):
            issue_join_credentials(session=self.live_session, user=self.student)

    def test_the_message_quotes_no_time(self):
        early = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=45)
        with self.assertRaises(SessionNotJoinableError) as caught:
            issue_join_credentials(session=early, user=self.student)
        # The server only knows UTC while the browser renders local time, so a
        # timestamp here would contradict the clock beside it.
        self.assertNotIn(":", str(caught.exception))

    def test_the_token_outlives_the_class(self):
        credentials = issue_join_credentials(session=self.live_session, user=self.student)
        _, _, ends_at = (
            self.live_session.scheduled_at,
            None,
            self.live_session.scheduled_at
            + timedelta(minutes=self.live_session.duration_minutes),
        )
        self.assertGreater(credentials["expires_at"], ends_at)

    def test_joining_writes_one_attendance_row_and_counts_rejoins(self):
        issue_join_credentials(session=self.live_session, user=self.student)
        issue_join_credentials(session=self.live_session, user=self.student)

        attendance = ClassSessionAttendance.objects.get(
            session=self.live_session, user=self.student
        )
        self.assertEqual(attendance.join_count, 2)
        self.assertEqual(attendance.role, "STUDENT")
        self.assertIsNone(attendance.left_at)

    def test_leaving_is_recorded_and_a_rejoin_clears_it(self):
        issue_join_credentials(session=self.live_session, user=self.student)
        record_leave(session=self.live_session, user=self.student)
        self.assertIsNotNone(
            ClassSessionAttendance.objects.get(
                session=self.live_session, user=self.student
            ).left_at
        )

        issue_join_credentials(session=self.live_session, user=self.student)
        self.assertIsNone(
            ClassSessionAttendance.objects.get(
                session=self.live_session, user=self.student
            ).left_at
        )


class UnconfiguredAgoraTests(ClassroomTestCase):
    @override_settings(AGORA_APP_ID="", AGORA_APP_CERTIFICATE="")
    def test_joining_fails_honestly_when_no_credentials_are_set(self):
        live = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=-10)
        with self.assertRaises(AgoraNotConfiguredError):
            issue_join_credentials(session=live, user=self.student)

    @override_settings(AGORA_APP_ID=APP_ID, AGORA_APP_CERTIFICATE="")
    def test_an_app_id_without_a_certificate_is_still_unconfigured(self):
        live = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=-10)
        with self.assertRaises(AgoraNotConfiguredError):
            issue_join_credentials(session=live, user=self.student)


WHITEBOARD_SETTINGS = {
    "AGORA_WHITEBOARD_APP_IDENTIFIER": "cool-nerds-team/wb-app-identifier",
    "AGORA_WHITEBOARD_ACCESS_KEY": "wb-access-key",
    "AGORA_WHITEBOARD_SECRET_KEY": "wb-secret-key",
    "AGORA_WHITEBOARD_REGION": "us-sv",
}


@override_settings(**WHITEBOARD_SETTINGS)
class WhiteboardCredentialTests(TestCase):
    """Who gets a pen, and who cannot get one however they ask."""

    def setUp(self):
        self.teacher = make_user("wbteacher", UserModel.Roles.TEACHER)
        self.student = make_user("wbstudent", UserModel.Roles.STUDENT)
        self.outsider = make_user("wboutsider", UserModel.Roles.STUDENT)

        self.course = make_course(code="WB-101", title="Whiteboard course")
        assign_teacher(self.course, self.teacher)
        enrol(self.course, self.student)

        self.session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-5
        )

    def _issue(self, user, room_uuid="room-created-once"):
        with mock.patch(
            "class_sessions.services.create_room", return_value=room_uuid
        ) as create:
            credentials = issue_whiteboard_credentials(session=self.session, user=user)
        return credentials, create

    def test_the_teacher_is_minted_a_writers_token(self):
        credentials, _ = self._issue(self.teacher)

        self.assertEqual(credentials["role"], "writer")
        self.assertTrue(credentials["writable"])
        self.assertTrue(credentials["is_host"])
        decoded = decode_token(credentials["room_token"], WHITEBOARD_SETTINGS["AGORA_WHITEBOARD_SECRET_KEY"])
        self.assertEqual(decoded["role_name"], "writer")
        self.assertTrue(decoded["signature_valid"])

    def test_a_student_is_minted_a_readers_token_while_the_teacher_presents(self):
        credentials, _ = self._issue(self.student)

        self.assertEqual(credentials["role"], "reader")
        self.assertFalse(credentials["writable"])
        self.assertEqual(
            decode_token(credentials["room_token"])["role_name"], "reader"
        )

    def test_a_student_is_minted_a_writers_token_once_the_board_is_opened_up(self):
        set_whiteboard_access(
            session=self.session,
            user=self.teacher,
            access=ClassSession.WhiteboardAccess.EVERYONE,
        )
        credentials, _ = self._issue(self.student)

        self.assertEqual(credentials["role"], "writer")
        self.assertTrue(credentials["writable"])

    def test_the_token_is_bound_to_this_classs_room(self):
        credentials, _ = self._issue(self.teacher, room_uuid="only-this-room")
        self.assertEqual(decode_token(credentials["room_token"])["uuid"], "only-this-room")

    def test_the_room_is_created_once_and_then_remembered(self):
        _, first = self._issue(self.teacher)
        self.session.refresh_from_db()
        _, second = self._issue(self.student)

        self.assertEqual(first.call_count, 1)
        self.assertEqual(second.call_count, 0)
        self.assertEqual(self.session.whiteboard_room_uuid, "room-created-once")
        self.assertEqual(self.session.whiteboard_region, "us-sv")

    def test_the_region_a_room_was_created_in_is_what_is_served_afterwards(self):
        """Settings move; a room does not.

        A board created in Silicon Valley is invisible from Frankfurt, so a
        later change to AGORA_WHITEBOARD_REGION must not quietly orphan every
        class that already has one.
        """
        self._issue(self.teacher)
        self.session.refresh_from_db()

        with override_settings(AGORA_WHITEBOARD_REGION="eu"):
            credentials, create = self._issue(self.student)

        self.assertEqual(credentials["region"], "us-sv")
        self.assertEqual(create.call_count, 0)

    def test_a_student_who_is_not_enrolled_gets_nothing(self):
        with self.assertRaises(SessionAccessDeniedError):
            self._issue(self.outsider)

    def test_the_board_is_behind_the_same_door_as_the_call(self):
        far_off = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=180
        )
        with mock.patch("class_sessions.services.create_room") as create:
            with self.assertRaises(SessionNotJoinableError):
                issue_whiteboard_credentials(session=far_off, user=self.student)
        self.assertEqual(create.call_count, 0)

    def test_a_cancelled_class_has_no_board(self):
        cancel_class(self.session, "Snow day")
        with self.assertRaises(SessionNotJoinableError):
            self._issue(self.teacher)

    def test_opening_the_board_does_not_mark_anybody_present(self):
        """A register says who came to class, not who looked at the board."""
        self._issue(self.student)
        self.assertFalse(
            ClassSessionAttendance.objects.filter(session=self.session).exists()
        )

    def test_only_a_host_may_hand_the_pen_over(self):
        with self.assertRaises(SessionAccessDeniedError):
            set_whiteboard_access(
                session=self.session,
                user=self.student,
                access=ClassSession.WhiteboardAccess.EVERYONE,
            )

    def test_an_unknown_access_setting_is_refused(self):
        with self.assertRaises(SessionScheduleError):
            set_whiteboard_access(
                session=self.session, user=self.teacher, access="ANYONE_ON_THE_INTERNET"
            )

    @override_settings(AGORA_WHITEBOARD_SECRET_KEY="")
    def test_a_server_without_whiteboard_keys_says_so(self):
        self.assertFalse(is_whiteboard_configured())
        with self.assertRaises(WhiteboardNotConfiguredError):
            self._issue(self.teacher)

    @override_settings(AGORA_WHITEBOARD_REGION="mars")
    def test_an_unknown_region_is_a_configuration_error_not_a_silent_fallback(self):
        self.assertFalse(is_whiteboard_configured())
        with self.assertRaises(WhiteboardNotConfiguredError):
            self._issue(self.teacher)

    def test_video_credentials_still_work_without_whiteboard_keys(self):
        """The two products are configured separately and fail separately."""
        with override_settings(
            AGORA_WHITEBOARD_APP_IDENTIFIER="",
            AGORA_WHITEBOARD_ACCESS_KEY="",
            AGORA_WHITEBOARD_SECRET_KEY="",
            AGORA_APP_ID="2f0e20ac920f4bcdb342451a6653358e",
            AGORA_APP_CERTIFICATE="9b86a609600d427cbe3cd2f7dd6e4a93",
        ):
            credentials = issue_join_credentials(session=self.session, user=self.student)
        self.assertTrue(credentials["token"])

    @override_settings(AGORA_WHITEBOARD_APP_IDENTIFIER="wb-app-identifier")
    def test_an_app_identifier_without_a_team_half_is_refused_here(self):
        """`<team>/<app>`, which the SDK enforces in the browser.

        Copying only the half after the slash out of the Agora Console is the
        usual mistake, and left to the SDK it surfaces as an exception thrown
        from inside a 2.8 MB bundle — which reads as a broken whiteboard
        rather than as a mistyped environment variable.
        """
        self.assertFalse(is_whiteboard_configured())
        with self.assertRaises(WhiteboardNotConfiguredError):
            self._issue(self.teacher)
