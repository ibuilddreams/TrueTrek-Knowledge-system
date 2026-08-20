from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from pathways.models import Pathway

from ..models import Tier, TierPathway, TierProgress

UserModel = get_user_model()


def make_user(email, role, **extra):
    return UserModel.objects.create_user(
        username=email.split("@")[0],
        email=email,
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
        **extra,
    )


class TierTestCase(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.student = make_user("student@example.com", UserModel.Roles.STUDENT)

        self.tier1 = Tier.objects.create(name="The Blueprint", level=1, status=Status.PUBLISHED)
        self.tier2 = Tier.objects.create(name="The Recruiting Window", level=2, status=Status.PUBLISHED)
        self.draft_tier = Tier.objects.create(name="Unreleased Tier", level=3, status=Status.DRAFT)


class TierEnvelopeAndVisibilityTests(TierTestCase):
    def test_response_uses_success_envelope_shape(self):
        response = self.client.get(reverse("tier-public-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        self.assertIn("message", response.data)
        self.assertIn("data", response.data)
        self.assertNotIn("detail", response.data)

    def test_public_list_only_shows_published(self):
        response = self.client.get(reverse("tier-public-list"))
        names = [row["name"] for row in response.data["data"]["results"]]
        self.assertIn("The Blueprint", names)
        self.assertNotIn("Unreleased Tier", names)

    def test_public_detail_hides_draft_tier(self):
        response = self.client.get(reverse("tier-public-detail", args=[self.draft_tier.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_detail_shows_published_tier(self):
        response = self.client.get(reverse("tier-public-detail", args=[self.tier1.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["name"], "The Blueprint")


class TierPermissionTests(TierTestCase):
    def test_anonymous_cannot_list_authenticated_tier_endpoint(self):
        response = self.client.get(reverse("tier-list-create"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_create_tier(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("tier-list-create"), {"name": "New Tier", "level": 4})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_tier(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse("tier-list-create"), {"name": "New Tier", "level": 4})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["level"], 4)

    def test_non_admin_cannot_update_tier(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(reverse("tier-detail", args=[self.tier1.id]), {"name": "Renamed"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_and_delete_tier(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(reverse("tier-detail", args=[self.tier1.id]), {"name": "Renamed"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["name"], "Renamed")

        response = self.client.delete(reverse("tier-detail", args=[self.tier1.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Tier.objects.filter(id=self.tier1.id).exists())

    def test_create_rejects_duplicate_level(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse("tier-list-create"), {"name": "Dup Level", "level": 1})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TierOrderViewTests(TierTestCase):
    def test_admin_can_reorder_tiers(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("tier-order"),
            [
                {"tier_id": self.tier1.id, "level": 3},
                {"tier_id": self.tier2.id, "level": 1},
                {"tier_id": self.draft_tier.id, "level": 2},
            ],
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tier1.refresh_from_db()
        self.tier2.refresh_from_db()
        self.assertEqual(self.tier1.level, 3)
        self.assertEqual(self.tier2.level, 1)

    def test_reorder_rejects_mismatched_id_set(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("tier-order"),
            [{"tier_id": self.tier1.id, "level": 1}],
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_reorder_tiers(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(reverse("tier-order"), [], format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TierPathwayViewTests(TierTestCase):
    def setUp(self):
        super().setUp()
        self.pathway_a = Pathway.objects.create(name="Pathway A")
        self.pathway_b = Pathway.objects.create(name="Pathway B")
        self.tp_a = TierPathway.objects.create(tier=self.tier1, pathway=self.pathway_a, order=1)
        self.tp_b = TierPathway.objects.create(tier=self.tier1, pathway=self.pathway_b, order=2)

    def test_admin_can_attach_pathway_to_tier(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("tier-pathway-attach", args=[self.tier2.id]),
            {"pathway": self.pathway_a.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TierPathway.objects.filter(tier=self.tier2, pathway=self.pathway_a).exists())

    def test_attaching_same_pathway_to_a_second_tier_succeeds(self):
        # This is the core capability of the many-to-many refactor: a pathway
        # already attached to tier1 can also be attached to tier2.
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("tier-pathway-attach", args=[self.tier2.id]),
            {"pathway": self.pathway_a.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TierPathway.objects.filter(pathway=self.pathway_a).count(), 2)

    def test_attach_rejects_duplicate_attachment_to_same_tier(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("tier-pathway-attach", args=[self.tier1.id]),
            {"pathway": self.pathway_a.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_attach_pathway(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("tier-pathway-attach", args=[self.tier2.id]),
            {"pathway": self.pathway_a.id},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_detach_pathway_from_tier(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            reverse("tier-pathway-detach", args=[self.tier1.id, self.pathway_a.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(TierPathway.objects.filter(tier=self.tier1, pathway=self.pathway_a).exists())

    def test_detach_returns_404_when_not_attached(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            reverse("tier-pathway-detach", args=[self.tier2.id, self.pathway_a.id])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_reorder_pathways_within_a_tier(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("tier-pathway-order", args=[self.tier1.id]),
            [
                {"tierpathway_id": self.tp_a.id, "order": 2},
                {"tierpathway_id": self.tp_b.id, "order": 1},
            ],
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tp_a.refresh_from_db()
        self.tp_b.refresh_from_db()
        self.assertEqual(self.tp_a.order, 2)
        self.assertEqual(self.tp_b.order, 1)

    def test_reorder_pathways_returns_404_for_unknown_tier(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("tier-pathway-order", args=[999999]),
            [],
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MyTierProgressViewTests(TierTestCase):
    def test_auto_creates_progress_rows_on_first_read(self):
        self.client.force_authenticate(user=self.student)
        self.assertFalse(TierProgress.objects.filter(student=self.student).exists())

        response = self.client.get(reverse("tier-mine"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.data["data"]
        by_level = {row["tier"]["level"]: row for row in rows}
        self.assertEqual(by_level[1]["status"], "LOCKED")
        self.assertEqual(by_level[2]["status"], "LOCKED")

    def test_requires_authentication(self):
        response = self.client.get(reverse("tier-mine"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tier_progress_detail_for_specific_tier(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("tier-progress-detail", args=[self.tier1.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["status"], "LOCKED")
