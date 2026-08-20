from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from pathways.models import Pathway
from tiers.models import Tier, TierPathway

from ..models import (
    OnboardingProgress,
    Question,
    QuestionOption,
    QuestionOptionPathwayWeight,
    QuestionnaireAnswer,
)

UserModel = get_user_model()


def make_user(email, role):
    return UserModel.objects.create_user(
        username=email.split("@")[0],
        email=email,
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


class OnboardingTestCase(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.student = make_user("student@example.com", UserModel.Roles.STUDENT)

        self.parent_pathway = Pathway.objects.create(
            name="Parent Pathway", status=Status.PUBLISHED, base_price=100
        )
        self.athlete_pathway = Pathway.objects.create(
            name="Athlete Pathway", status=Status.PUBLISHED, base_price=100
        )

        self.question = Question.objects.create(text="What describes you best?", order=1)
        self.parent_option = QuestionOption.objects.create(
            question=self.question, text="Parent", order=1
        )
        self.athlete_option = QuestionOption.objects.create(
            question=self.question, text="Athlete", order=2
        )
        QuestionOptionPathwayWeight.objects.create(
            option=self.parent_option, pathway=self.parent_pathway, weight=5
        )
        QuestionOptionPathwayWeight.objects.create(
            option=self.athlete_option, pathway=self.athlete_pathway, weight=5
        )


class QuestionnaireFlowTests(OnboardingTestCase):
    def test_public_questions_hide_scoring_weights(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("onboarding-question-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        option = response.data["data"][0]["options"][0]
        self.assertNotIn("pathway_weights", option)

    def test_submit_answers_then_recommendation_favors_matching_pathway(self):
        self.client.force_authenticate(user=self.student)
        submit_response = self.client.post(
            reverse("onboarding-answers-submit"),
            {"answers": [{"question": self.question.id, "option": self.parent_option.id}]},
            format="json",
        )
        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            QuestionnaireAnswer.objects.filter(
                user=self.student, question=self.question, option=self.parent_option
            ).exists()
        )

        response = self.client.get(reverse("onboarding-recommendations"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        by_name = {row["name"]: row["score"] for row in response.data["data"]}
        self.assertEqual(by_name["Parent Pathway"], 5)
        self.assertEqual(by_name["Athlete Pathway"], 0)

    def test_recommendation_surfaces_tier_when_present_and_omits_it_when_absent(self):
        tier = Tier.objects.create(name="The Blueprint", level=1)
        TierPathway.objects.create(tier=tier, pathway=self.parent_pathway, order=1)

        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("onboarding-recommendations"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        by_name = {row["name"]: row["tiers"] for row in response.data["data"]}
        self.assertEqual(by_name["Parent Pathway"][0]["name"], "The Blueprint")
        self.assertEqual(by_name["Athlete Pathway"], [])

    def test_questions_reflect_previously_saved_answer(self):
        QuestionnaireAnswer.objects.create(
            user=self.student, question=self.question, option=self.parent_option
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("onboarding-question-list"))

        question_data = response.data["data"][0]
        self.assertEqual(question_data["selected_option_ids"], [self.parent_option.id])

    def test_questions_show_no_selection_for_unanswered_user(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("onboarding-question-list"))

        question_data = response.data["data"][0]
        self.assertEqual(question_data["selected_option_ids"], [])


class OnboardingProgressTests(OnboardingTestCase):
    def setUp(self):
        super().setUp()
        self.progress_url = reverse("onboarding-progress")

    def test_get_returns_none_when_no_progress_saved(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.progress_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["data"])

    def test_put_creates_and_updates_progress(self):
        self.client.force_authenticate(user=self.student)

        create_response = self.client.put(
            self.progress_url,
            {"step": "RECOMMENDATION", "selected_pathway_ids": []},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_200_OK)
        self.assertEqual(OnboardingProgress.objects.filter(user=self.student).count(), 1)

        update_response = self.client.put(
            self.progress_url,
            {"step": "CHECKOUT", "selected_pathway_ids": [self.parent_pathway.id]},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(OnboardingProgress.objects.filter(user=self.student).count(), 1)

        progress = OnboardingProgress.objects.get(user=self.student)
        self.assertEqual(progress.step, "CHECKOUT")
        self.assertEqual(progress.selected_pathway_ids, [self.parent_pathway.id])

    def test_get_returns_saved_progress(self):
        OnboardingProgress.objects.create(
            user=self.student, step="PREVIEW", selected_pathway_ids=[self.athlete_pathway.id]
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.progress_url)
        self.assertEqual(response.data["data"]["step"], "PREVIEW")
        self.assertEqual(response.data["data"]["selected_pathway_ids"], [self.athlete_pathway.id])

    def test_delete_clears_progress(self):
        OnboardingProgress.objects.create(user=self.student, step="CHECKOUT")
        self.client.force_authenticate(user=self.student)

        response = self.client.delete(self.progress_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(OnboardingProgress.objects.filter(user=self.student).exists())

    def test_progress_is_scoped_per_user(self):
        other_student = make_user("other@example.com", UserModel.Roles.STUDENT)
        OnboardingProgress.objects.create(user=other_student, step="CHECKOUT")

        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.progress_url)
        self.assertIsNone(response.data["data"])

    def test_requires_authentication(self):
        response = self.client.get(self.progress_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_invalid_step(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.put(self.progress_url, {"step": "NOT_A_STEP"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resubmitting_same_question_overwrites_previous_answer(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(
            reverse("onboarding-answers-submit"),
            {"answers": [{"question": self.question.id, "option": self.parent_option.id}]},
            format="json",
        )
        self.client.post(
            reverse("onboarding-answers-submit"),
            {"answers": [{"question": self.question.id, "option": self.athlete_option.id}]},
            format="json",
        )

        self.assertEqual(QuestionnaireAnswer.objects.filter(user=self.student).count(), 1)
        answer = QuestionnaireAnswer.objects.get(user=self.student, question=self.question)
        self.assertEqual(answer.option_id, self.athlete_option.id)

    def test_option_must_belong_to_question(self):
        other_question = Question.objects.create(text="Other question", order=2)
        other_option = QuestionOption.objects.create(question=other_question, text="Other", order=1)

        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("onboarding-answers-submit"),
            {"answers": [{"question": self.question.id, "option": other_option.id}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminQuestionManagementTests(OnboardingTestCase):
    def test_non_admin_cannot_manage_questions(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("onboarding-admin-question-list-create"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_question_with_options_and_weights(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "text": "How much time can you commit weekly?",
            "options": [
                {"text": "1-2 hours", "pathway_weights": []},
                {
                    "text": "5+ hours",
                    "pathway_weights": [{"pathway": self.parent_pathway.id, "weight": 2}],
                },
            ],
        }
        response = self.client.post(reverse("onboarding-admin-question-list-create"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        question = Question.objects.get(text=payload["text"])
        self.assertEqual(question.options.count(), 2)
        heavy_option = question.options.get(text="5+ hours")
        self.assertEqual(heavy_option.pathway_weights.get().weight, 2)
