from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import ClassSession, ClassSessionAttendance
from .factories import assign_teacher, enrol, make_course, make_session, make_user

UserModel = get_user_model()

APP_ID = "2f0e20ac920f4bcdb342451a6653358e"
APP_CERTIFICATE = "9b86a609600d427cbe3cd2f7dd6e4a93"


@override_settings(AGORA_APP_ID=APP_ID, AGORA_APP_CERTIFICATE=APP_CERTIFICATE)
class ClassSessionViewTestCase(APITestCase):
    def setUp(self):
        self.teacher = make_user("viewteacher", UserModel.Roles.TEACHER)
        self.other_teacher = make_user("viewotherteacher", UserModel.Roles.TEACHER)
        self.student = make_user("viewstudent", UserModel.Roles.STUDENT)
        self.outsider = make_user("viewoutsider", UserModel.Roles.STUDENT)

        self.course = make_course()
        assign_teacher(self.course, self.teacher)
        enrol(self.course, self.student)

        self.session = make_session(course=self.course, teacher=self.teacher)
        self.live_session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-10, title="Live now"
        )


class TeacherSchedulingTests(ClassSessionViewTestCase):
    def test_a_student_cannot_reach_the_teacher_api(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("class-sessions-teacher-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_a_teacher_only_lists_classes_on_their_own_courses(self):
        other_course = make_course(code="BRD-201", title="Brand Building")
        assign_teacher(other_course, self.other_teacher)
        make_session(course=other_course, teacher=self.other_teacher, title="Not mine")

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(reverse("class-sessions-teacher-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {row["title"] for row in response.json()["data"]["results"]}
        self.assertNotIn("Not mine", titles)

    def test_scheduling_a_class(self):
        self.client.force_authenticate(user=self.teacher)
        starts_at = timezone.now() + timedelta(days=1)

        response = self.client.post(
            reverse("class-sessions-teacher-list"),
            {
                "course": self.course.pk,
                "title": "Contract Basics",
                "description": "What a term sheet actually says.",
                "agenda": ["Term sheets", "Red flags"],
                "scheduled_at": starts_at.isoformat(),
                "duration_minutes": 45,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()["data"]
        self.assertEqual(data["title"], "Contract Basics")
        self.assertEqual(data["agenda"], ["Term sheets", "Red flags"])
        self.assertTrue(data["is_host"])
        # No Agora credential is ever part of a session payload.
        self.assertNotIn("channel_name", data)

    def test_a_teacher_cannot_schedule_on_someone_elses_course(self):
        other_course = make_course(code="BRD-201", title="Brand Building")
        assign_teacher(other_course, self.other_teacher)

        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("class-sessions-teacher-list"),
            {
                "course": other_course.pk,
                "title": "Gatecrash",
                "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
                "duration_minutes": 60,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_class_cannot_be_scheduled_in_the_past(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("class-sessions-teacher-list"),
            {
                "course": self.course.pk,
                "title": "Yesterday",
                "scheduled_at": (timezone.now() - timedelta(days=1)).isoformat(),
                "duration_minutes": 60,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_double_booking_is_refused_with_an_explanation(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("class-sessions-teacher-list"),
            {
                "course": self.course.pk,
                "title": "Clashes",
                "scheduled_at": self.session.scheduled_at.isoformat(),
                "duration_minutes": 60,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(self.session.title, response.json()["message"])

    def test_editing_a_class(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            reverse("class-sessions-teacher-detail", args=[self.session.pk]),
            {"title": "Film Review: Week 5"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["title"], "Film Review: Week 5")

    def test_a_class_cannot_be_moved_onto_another_course(self):
        other_course = make_course(code="BRD-201", title="Brand Building")
        assign_teacher(other_course, self.teacher)

        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            reverse("class-sessions-teacher-detail", args=[self.session.pk]),
            {"course": other_course.pk},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.course_id, self.course.pk)

    def test_another_teachers_class_is_not_found(self):
        other_course = make_course(code="BRD-201", title="Brand Building")
        assign_teacher(other_course, self.other_teacher)
        theirs = make_session(course=other_course, teacher=self.other_teacher)

        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            reverse("class-sessions-teacher-detail", args=[theirs.pk]),
            {"title": "Hijacked"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deleting_a_class_nobody_joined_removes_it(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.delete(
            reverse("class-sessions-teacher-detail", args=[self.session.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ClassSession.objects.filter(pk=self.session.pk).exists())

    def test_deleting_a_class_that_was_taught_cancels_it_instead(self):
        ClassSessionAttendance.objects.create(
            session=self.live_session,
            user=self.student,
            first_joined_at=timezone.now(),
            last_joined_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.teacher)
        response = self.client.delete(
            reverse("class-sessions-teacher-detail", args=[self.live_session.pk]),
            {"cancellation_reason": "Power cut"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.live_session.refresh_from_db()
        self.assertEqual(self.live_session.status, ClassSession.SessionStatus.CANCELLED)
        self.assertEqual(self.live_session.cancellation_reason, "Power cut")

    def test_the_register_lists_who_turned_up(self):
        ClassSessionAttendance.objects.create(
            session=self.live_session,
            user=self.student,
            first_joined_at=timezone.now(),
            last_joined_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(
            reverse("class-sessions-teacher-attendance", args=[self.live_session.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = response.json()["data"]["results"][0]
        self.assertEqual(row["student_email"], self.student.email)
        self.assertEqual(row["join_count"], 1)


class StudentListingTests(ClassSessionViewTestCase):
    def test_listing_requires_authentication(self):
        response = self.client.get(reverse("class-sessions-my-upcoming"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_a_student_sees_the_classes_for_their_courses(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("class-sessions-my-upcoming"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.json()["data"]["results"]
        self.assertEqual({row["title"] for row in rows}, {"Film Review: Week 4", "Live now"})
        for row in rows:
            self.assertNotIn("channel_name", row)
            self.assertFalse(row["is_host"])

    def test_an_unenrolled_student_sees_nothing(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(reverse("class-sessions-my-upcoming"))
        self.assertEqual(response.json()["data"]["results"], [])

    def test_a_class_on_another_course_is_not_found(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(reverse("class-sessions-detail", args=[self.session.pk]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class JoinTests(ClassSessionViewTestCase):
    def test_a_student_joins_a_live_class(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("class-sessions-join", args=[self.live_session.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertEqual(data["channel_name"], self.live_session.channel_name)
        self.assertEqual(data["uid"], self.student.pk)
        self.assertEqual(data["role"], "STUDENT")
        self.assertTrue(data["token"].startswith("007"))
        # The App ID is the frontend's own env var, never served from here.
        self.assertNotIn("app_id", data)
        # The roster is what labels the video tiles.
        self.assertEqual(
            {entry["uid"] for entry in data["roster"]}, {self.teacher.pk, self.student.pk}
        )

    def test_joining_too_early_is_refused_but_the_class_is_not_hidden(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("class-sessions-join", args=[self.session.pk]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("opens", response.json()["message"])

    def test_an_unenrolled_student_cannot_join(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.post(
            reverse("class-sessions-join", args=[self.live_session.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_the_teacher_joins_as_host(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("class-sessions-join", args=[self.live_session.pk])
        )
        self.assertEqual(response.json()["data"]["role"], "HOST")

    def test_leaving_records_a_departure(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(reverse("class-sessions-join", args=[self.live_session.pk]))
        response = self.client.post(reverse("class-sessions-leave", args=[self.live_session.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(
            ClassSessionAttendance.objects.get(
                session=self.live_session, user=self.student
            ).left_at
        )

    @override_settings(AGORA_APP_ID="", AGORA_APP_CERTIFICATE="")
    def test_an_unconfigured_server_says_so_rather_than_failing_oddly(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("class-sessions-join", args=[self.live_session.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
