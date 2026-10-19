from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from rewards.models import StudentPointsAccount

from ..models import DailyQuestAssignment, Quest

UserModel = get_user_model()


def make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


class QuestsTestCase(APITestCase):
    def setUp(self):
        self.student = make_user("queststudent", UserModel.Roles.STUDENT)
        self.other_student = make_user("questother", UserModel.Roles.STUDENT)
        self.admin = make_user("questadmin", UserModel.Roles.ADMIN)

        self.quest = Quest.objects.create(
            title="Delete three off-brand posts",
            instructions="Remove what no longer fits your brand.",
            points_reward=20,
        )


class TodaysQuestsViewTests(QuestsTestCase):
    def test_requires_authentication(self):
        response = self.client.get(reverse("quests-today"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(DAILY_QUEST_COUNT=2)
    def test_assigns_and_returns_todays_quests_with_stats(self):
        Quest.objects.create(title="Second", instructions="Do the thing.", points_reward=5)
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("quests-today"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(len(body["quests"]), 2)
        self.assertEqual(body["stats"]["assigned_today"], 2)
        self.assertEqual(body["stats"]["completed_today"], 0)
        # Nested quest detail is what the card renders from.
        self.assertIn("instructions", body["quests"][0]["quest"])

    def test_repeated_calls_do_not_create_more_assignments(self):
        self.client.force_authenticate(user=self.student)
        self.client.get(reverse("quests-today"))
        self.client.get(reverse("quests-today"))

        self.assertEqual(DailyQuestAssignment.objects.filter(student=self.student).count(), 1)


class CompleteQuestViewTests(QuestsTestCase):
    def setUp(self):
        super().setUp()
        self.assignment = DailyQuestAssignment.objects.create(
            student=self.student, quest=self.quest, assigned_date=timezone.localdate()
        )

    def test_completing_awards_points_and_returns_fresh_stats(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            reverse("quests-complete", args=[self.assignment.id]),
            {"reflection": "Deleted 3 posts."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["quest"]["status"], "COMPLETED")
        self.assertEqual(body["quest"]["points_awarded"], 20)
        self.assertEqual(body["stats"]["completed_today"], 1)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 20)

    def test_completing_twice_is_rejected(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("quests-complete", args=[self.assignment.id])
        self.client.post(url, {}, format="json")

        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 20)

    def test_another_students_assignment_is_a_404_not_a_403(self):
        self.client.force_authenticate(user=self.other_student)

        response = self.client.post(
            reverse("quests-complete", args=[self.assignment.id]), {}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_an_unsupported_proof_type_is_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.force_authenticate(user=self.student)
        bad_proof = SimpleUploadedFile("proof.exe", b"binary", content_type="application/octet-stream")

        response = self.client.post(
            reverse("quests-complete", args=[self.assignment.id]),
            {"proof_file": bad_proof},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            DailyQuestAssignment.objects.get(pk=self.assignment.pk).status, "ASSIGNED"
        )

    def test_skipping_resolves_without_points(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(reverse("quests-skip", args=[self.assignment.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["quest"]["status"], "SKIPPED")
        self.assertFalse(StudentPointsAccount.objects.filter(student=self.student).exists())


class QuestHistoryViewTests(QuestsTestCase):
    def test_only_returns_the_requesting_students_rows(self):
        today = timezone.localdate()
        DailyQuestAssignment.objects.create(
            student=self.student, quest=self.quest, assigned_date=today
        )
        DailyQuestAssignment.objects.create(
            student=self.other_student, quest=self.quest, assigned_date=today
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("quests-history"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["count"], 1)


class AdminQuestCatalogTests(QuestsTestCase):
    def test_student_cannot_list_the_admin_catalog(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("quests-list-create"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_a_quest(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse("quests-list-create"),
            {
                "title": "Update your Instagram bio",
                "instructions": "Make it reflect your values.",
                "category": "PROFILE",
                "difficulty": "EASY",
                "points_reward": 15,
                "estimated_minutes": 5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["data"]["points_reward"], 15)
        self.assertTrue(Quest.objects.filter(title="Update your Instagram bio").exists())

    def test_a_zero_point_quest_is_rejected(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse("quests-list-create"),
            {"title": "Free quest", "instructions": "Nothing.", "points_reward": 0},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_reports_assignment_and_completion_counts(self):
        DailyQuestAssignment.objects.create(
            student=self.student,
            quest=self.quest,
            assigned_date=timezone.localdate(),
            status=DailyQuestAssignment.AssignmentStatus.COMPLETED,
        )
        DailyQuestAssignment.objects.create(
            student=self.other_student, quest=self.quest, assigned_date=timezone.localdate()
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("quests-list-create"))

        row = next(r for r in response.json()["data"]["results"] if r["id"] == self.quest.id)
        self.assertEqual(row["assignment_count"], 2)
        self.assertEqual(row["completion_count"], 1)

    def test_deleting_an_assigned_quest_archives_it_instead(self):
        DailyQuestAssignment.objects.create(
            student=self.student, quest=self.quest, assigned_date=timezone.localdate()
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(reverse("quests-detail", args=[self.quest.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quest.refresh_from_db()
        self.assertEqual(self.quest.status, Status.ARCHIVED)

    def test_deleting_a_never_assigned_quest_really_deletes_it(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(reverse("quests-detail", args=[self.quest.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Quest.objects.filter(pk=self.quest.pk).exists())


class AdminQuestStatsTests(QuestsTestCase):
    def test_stats_are_admin_only(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("quests-admin-stats"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(DAILY_QUEST_COUNT=3)
    def test_reports_catalog_health_and_completion(self):
        # 6 published quests at 3/day = 2 days of rotation before repeats.
        for index in range(5):
            Quest.objects.create(
                title=f"Extra {index}", instructions="Do it.", points_reward=10
            )
        Quest.objects.create(
            title="A draft", instructions="Not live.", status=Status.DRAFT, points_reward=10
        )

        today = timezone.localdate()
        DailyQuestAssignment.objects.create(
            student=self.student,
            quest=self.quest,
            assigned_date=today,
            status=DailyQuestAssignment.AssignmentStatus.COMPLETED,
            points_awarded=20,
        )
        DailyQuestAssignment.objects.create(
            student=self.other_student, quest=self.quest, assigned_date=today
        )

        self.client.force_authenticate(user=self.admin)
        body = self.client.get(reverse("quests-admin-stats")).json()["data"]

        self.assertEqual(body["published_quests"], 6)
        self.assertEqual(body["draft_quests"], 1)
        self.assertEqual(body["quests_per_student_per_day"], 3)
        self.assertEqual(body["days_of_rotation"], 2)
        self.assertEqual(body["total_assigned"], 2)
        self.assertEqual(body["total_completed"], 1)
        self.assertEqual(body["completion_rate"], 50)
        self.assertEqual(body["points_awarded"], 20)
        self.assertEqual(body["active_students_today"], 2)

    def test_completion_rate_is_zero_rather_than_dividing_by_zero(self):
        self.client.force_authenticate(user=self.admin)
        body = self.client.get(reverse("quests-admin-stats")).json()["data"]

        self.assertEqual(body["total_assigned"], 0)
        self.assertEqual(body["completion_rate"], 0)
        self.assertEqual(body["points_awarded"], 0)


class AdminQuestSubmissionsTests(QuestsTestCase):
    """The "who completed which quest" screen."""

    def setUp(self):
        super().setUp()
        self.student.name = "Ava Johnson"
        self.student.save(update_fields=["name"])
        self.other_student.name = "Marcus Webb"
        self.other_student.save(update_fields=["name"])

        self.other_quest = Quest.objects.create(
            title="Rewrite your Instagram bio",
            instructions="Make it reflect your values.",
            points_reward=10,
        )
        today = timezone.localdate()

        self.completed = DailyQuestAssignment.objects.create(
            student=self.student,
            quest=self.quest,
            assigned_date=today,
            status=DailyQuestAssignment.AssignmentStatus.COMPLETED,
            points_awarded=20,
            reflection="Deleted 4 old posts.",
            proof_url="https://instagram.com/p/abc",
        )
        self.skipped = DailyQuestAssignment.objects.create(
            student=self.other_student,
            quest=self.quest,
            assigned_date=today,
            status=DailyQuestAssignment.AssignmentStatus.SKIPPED,
        )
        self.assigned = DailyQuestAssignment.objects.create(
            student=self.other_student,
            quest=self.other_quest,
            assigned_date=today - timedelta(days=1),
        )

    def _get(self, query=""):
        self.client.force_authenticate(user=self.admin)
        return self.client.get(f"{reverse('quests-admin-submissions')}{query}")

    def test_students_cannot_read_other_peoples_submissions(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("quests-admin-submissions"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_every_students_rows_with_who_did_what(self):
        response = self._get()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["count"], 3)

        row = next(r for r in body["results"] if r["id"] == self.completed.id)
        self.assertEqual(row["student_name"], "Ava Johnson")
        self.assertEqual(row["student_email"], self.student.email)
        self.assertEqual(row["quest_title"], self.quest.title)
        self.assertEqual(row["points_awarded"], 20)
        self.assertEqual(row["reflection"], "Deleted 4 old posts.")
        self.assertEqual(row["proof_url"], "https://instagram.com/p/abc")

    def test_newest_activity_comes_first(self):
        results = self._get().json()["data"]["results"]
        # The day-old assignment must not outrank today's rows.
        self.assertEqual(results[-1]["id"], self.assigned.id)

    def test_filters_by_status(self):
        body = self._get("?status=COMPLETED").json()["data"]
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["id"], self.completed.id)

        body = self._get("?status=SKIPPED").json()["data"]
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["id"], self.skipped.id)

    def test_filters_by_quest(self):
        body = self._get(f"?quest={self.other_quest.id}").json()["data"]
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["quest_title"], "Rewrite your Instagram bio")

    def test_filters_by_student(self):
        body = self._get(f"?student={self.student.id}").json()["data"]
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["student_email"], self.student.email)

    def test_searches_by_student_name_email_and_quest_title(self):
        self.assertEqual(self._get("?search=Ava").json()["data"]["count"], 1)
        self.assertEqual(self._get("?search=questother").json()["data"]["count"], 2)
        self.assertEqual(self._get("?search=Instagram").json()["data"]["count"], 1)
        self.assertEqual(self._get("?search=nobody-here").json()["data"]["count"], 0)

    def test_has_proof_filter_matches_a_link_or_a_file(self):
        body = self._get("?has_proof=true").json()["data"]
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["id"], self.completed.id)

    def test_filters_by_date_range(self):
        yesterday = (timezone.localdate() - timedelta(days=1)).isoformat()
        body = self._get(f"?date_to={yesterday}").json()["data"]
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["id"], self.assigned.id)
