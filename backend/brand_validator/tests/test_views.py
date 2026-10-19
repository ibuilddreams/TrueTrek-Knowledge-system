from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import MediaKitReview

UserModel = get_user_model()


def make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


def media_kit_file(name="kit.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 fake media kit", content_type="application/pdf")


class BrandValidatorTestCase(APITestCase):
    def setUp(self):
        self.student = make_user("kitstudent", UserModel.Roles.STUDENT)
        self.other_student = make_user("kitother", UserModel.Roles.STUDENT)


class UploadViewTests(BrandValidatorTestCase):
    """The view's own contract. The worker thread is patched out here — what
    it does once started is covered synchronously in test_services.py, the
    same split ai_courses/tests/test_services.py uses."""

    def test_requires_authentication(self):
        response = self.client.post(
            reverse("media-kit-review-list-create"), {"file": media_kit_file()}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_creates_a_pending_review_and_starts_a_worker(self):
        self.client.force_authenticate(user=self.student)

        with patch("brand_validator.services.threading.Thread") as mock_thread:
            response = self.client.post(
                reverse("media-kit-review-list-create"),
                {"file": media_kit_file(), "athlete_context": "Junior point guard."},
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()["data"]
        self.assertEqual(body["status"], "PENDING")
        self.assertEqual(body["original_name"], "kit.pdf")

        review = MediaKitReview.objects.get(pk=body["id"])
        self.assertEqual(review.student, self.student)
        self.assertEqual(review.athlete_context, "Junior point guard.")
        mock_thread.assert_called_once()
        # The worker is handed the review id and the mime type it must send.
        self.assertEqual(mock_thread.call_args.kwargs["args"], (review.id, "application/pdf"))

    def test_an_unsupported_file_type_is_rejected_before_any_model_call(self):
        self.client.force_authenticate(user=self.student)

        with patch("brand_validator.services.threading.Thread") as mock_thread:
            response = self.client.post(
                reverse("media-kit-review-list-create"),
                {
                    "file": SimpleUploadedFile(
                        "kit.docx", b"PK", content_type="application/octet-stream"
                    )
                },
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MediaKitReview.objects.exists())
        mock_thread.assert_not_called()

    def test_a_second_upload_while_one_is_in_flight_is_refused(self):
        MediaKitReview.objects.create(
            student=self.student,
            file=media_kit_file(),
            status=MediaKitReview.ReviewStatus.PROCESSING,
        )
        self.client.force_authenticate(user=self.student)

        with patch("brand_validator.services.threading.Thread"):
            response = self.client.post(
                reverse("media-kit-review-list-create"),
                {"file": media_kit_file()},
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_another_students_in_flight_review_does_not_block_this_one(self):
        MediaKitReview.objects.create(
            student=self.other_student,
            file=media_kit_file(),
            status=MediaKitReview.ReviewStatus.PROCESSING,
        )
        self.client.force_authenticate(user=self.student)

        with patch("brand_validator.services.threading.Thread"):
            response = self.client.post(
                reverse("media-kit-review-list-create"),
                {"file": media_kit_file()},
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ReviewAccessTests(BrandValidatorTestCase):
    def setUp(self):
        super().setUp()
        self.review = MediaKitReview.objects.create(
            student=self.student,
            file=media_kit_file(),
            status=MediaKitReview.ReviewStatus.COMPLETED,
            overall_score=70,
            verdict="Promising",
            weaknesses=[{"title": "No stats", "detail": "Follower count alone.", "severity": "HIGH"}],
        )

    def test_owner_can_read_their_review_with_its_findings(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("media-kit-review-detail", args=[self.review.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["overall_score"], 70)
        self.assertEqual(body["weaknesses"][0]["severity"], "HIGH")

    def test_another_student_gets_a_404(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.get(reverse("media-kit-review-detail", args=[self.review.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_latest_returns_the_most_recent_review(self):
        newest = MediaKitReview.objects.create(
            student=self.student, file=media_kit_file(), status=MediaKitReview.ReviewStatus.PENDING
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("media-kit-review-latest"))

        self.assertEqual(response.json()["data"]["id"], newest.id)

    def test_latest_is_null_when_there_are_none(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.get(reverse("media-kit-review-latest"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.json()["data"])

    def test_list_only_returns_the_requesting_students_reviews(self):
        MediaKitReview.objects.create(student=self.other_student, file=media_kit_file())
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("media-kit-review-list-create"))

        self.assertEqual(response.json()["data"]["count"], 1)

    def test_owner_can_delete_their_review(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.delete(reverse("media-kit-review-detail", args=[self.review.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(MediaKitReview.objects.filter(pk=self.review.pk).exists())

    def test_another_student_cannot_delete_it(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.delete(reverse("media-kit-review-detail", args=[self.review.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(MediaKitReview.objects.filter(pk=self.review.pk).exists())
