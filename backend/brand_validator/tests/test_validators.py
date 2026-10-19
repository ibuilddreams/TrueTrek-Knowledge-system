from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import serializers

from ..validators import MAX_MEDIA_KIT_SIZE_MB, normalize_review_payload, validate_media_kit_file


class MediaKitFileValidationTests(TestCase):
    def test_accepts_a_pdf_and_returns_its_mime_type(self):
        upload = SimpleUploadedFile("kit.pdf", b"%PDF-1.4 ...", content_type="application/pdf")
        self.assertEqual(validate_media_kit_file(upload), "application/pdf")

    def test_accepts_images(self):
        upload = SimpleUploadedFile("kit.PNG", b"\x89PNG", content_type="image/png")
        self.assertEqual(validate_media_kit_file(upload), "image/png")

    def test_rejects_an_unsupported_type(self):
        upload = SimpleUploadedFile("kit.docx", b"PK", content_type="application/octet-stream")
        with self.assertRaises(serializers.ValidationError):
            validate_media_kit_file(upload)

    def test_rejects_an_oversized_file(self):
        upload = SimpleUploadedFile("kit.pdf", b"x", content_type="application/pdf")
        upload.size = (MAX_MEDIA_KIT_SIZE_MB + 1) * 1024 * 1024
        with self.assertRaises(serializers.ValidationError):
            validate_media_kit_file(upload)


class NormalizeReviewPayloadTests(TestCase):
    def _payload(self, **overrides):
        payload = {
            "overall_score": 62,
            "verdict": "Promising, but no numbers",
            "sponsor_verdict": "I like the story, but I can't tell what I'd get.",
            "summary": "Clean layout, no audience data.",
            "strengths": [{"title": "Strong photo", "detail": "The action shot is excellent."}],
            "weaknesses": [
                {"title": "No engagement stats", "detail": "Follower count alone.", "severity": "high"}
            ],
            "recommendations": [
                {"title": "Add engagement rate", "detail": "State your average likes.", "priority": 2},
                {"title": "Name a deliverable", "detail": "Offer 2 posts a month.", "priority": 1},
            ],
            "missing_elements": ["Engagement rate", "Audience demographics"],
        }
        payload.update(overrides)
        return payload

    def test_keeps_a_well_formed_payload_intact(self):
        result = normalize_review_payload(self._payload())

        self.assertEqual(result["overall_score"], 62)
        self.assertEqual(result["verdict"], "Promising, but no numbers")
        self.assertEqual(result["weaknesses"][0]["severity"], "HIGH")
        self.assertEqual(result["missing_elements"], ["Engagement rate", "Audience demographics"])

    def test_recommendations_are_sorted_by_priority(self):
        result = normalize_review_payload(self._payload())
        self.assertEqual([r["priority"] for r in result["recommendations"]], [1, 2])
        self.assertEqual(result["recommendations"][0]["title"], "Name a deliverable")

    def test_an_out_of_range_score_is_clamped(self):
        self.assertEqual(normalize_review_payload(self._payload(overall_score=140))["overall_score"], 100)
        self.assertEqual(normalize_review_payload(self._payload(overall_score=-5))["overall_score"], 0)

    def test_a_non_numeric_score_becomes_zero_rather_than_raising(self):
        self.assertEqual(normalize_review_payload(self._payload(overall_score="great"))["overall_score"], 0)

    def test_an_unknown_severity_falls_back_to_medium(self):
        payload = self._payload(
            weaknesses=[{"title": "Vague", "detail": "Unclear ask", "severity": "catastrophic"}]
        )
        self.assertEqual(normalize_review_payload(payload)["weaknesses"][0]["severity"], "MEDIUM")

    def test_a_list_of_bare_strings_is_tolerated(self):
        result = normalize_review_payload(self._payload(strengths=["Great action photo"]))
        self.assertEqual(result["strengths"][0]["detail"], "Great action photo")

    def test_a_nested_list_is_unwrapped(self):
        payload = self._payload(strengths={"items": [{"title": "Photo", "detail": "Sharp."}]})
        self.assertEqual(normalize_review_payload(payload)["strengths"][0]["title"], "Photo")

    def test_missing_keys_degrade_to_empty_rather_than_raising(self):
        result = normalize_review_payload({"overall_score": 50})
        self.assertEqual(result["strengths"], [])
        self.assertEqual(result["weaknesses"], [])
        self.assertEqual(result["missing_elements"], [])
        self.assertEqual(result["verdict"], "Review complete")

    def test_a_non_object_payload_is_a_real_failure(self):
        with self.assertRaises(ValueError):
            normalize_review_payload(["not", "an", "object"])
