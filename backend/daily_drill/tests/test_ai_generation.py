import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from ai_courses.providers.base import ProviderError, ProviderResult

from ..ai_generation import _fingerprint, generate_ai_drill, get_or_create_ai_drill
from ..models import AIDrillGeneration

UserModel = get_user_model()

VALID_DRILL_JSON = json.dumps(
    {
        "title": "Negotiating a Funding Offer",
        "question": "An alumnus offers $50,000 for 45% equity with a veto right. What do you do?",
        "context": "Secure resources without surrendering control.",
        "options": [
            {"key": "A", "text": "Accept immediately."},
            {"key": "B", "text": "Counter with a fair SAFE note."},
            {"key": "C", "text": "Publicly call out the offer as predatory."},
        ],
        "correct_answer": "B",
        "explanation": "A SAFE keeps governance clean and defers valuation fairly.",
        "difficulty": "MEDIUM",
        "topic": "Startup Funding",
    }
)


class StubProvider:
    def __init__(self, text, raises=None):
        self.text = text
        self.raises = raises
        self.call_count = 0

    def generate_course(self, prompt, response_schema, timeout):
        self.call_count += 1
        if self.raises:
            raise self.raises
        return ProviderResult(text=self.text, input_tokens=50, output_tokens=80)


def make_student(username):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


class GetOrCreateAIDrillTests(TestCase):
    def setUp(self):
        self.student = make_student("aidrillstudent")
        self.today = timezone.localdate()

    def test_generates_and_persists_on_first_request(self):
        provider = StubProvider(VALID_DRILL_JSON)
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            generation = get_or_create_ai_drill(self.student, self.today)

        self.assertIsNotNone(generation)
        self.assertEqual(provider.call_count, 1)
        self.assertEqual(generation.topic, "Startup Funding")
        self.assertEqual(generation.correct_answer, "B")
        self.assertEqual(len(generation.options), 3)
        self.assertEqual(AIDrillGeneration.objects.filter(student=self.student, drill_date=self.today).count(), 1)

    def test_repeated_request_same_day_does_not_call_provider_again(self):
        provider = StubProvider(VALID_DRILL_JSON)
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            first = get_or_create_ai_drill(self.student, self.today)
            second = get_or_create_ai_drill(self.student, self.today)

        self.assertEqual(provider.call_count, 1)
        self.assertEqual(first.pk, second.pk)

    def test_different_students_can_get_different_drills(self):
        other_student = make_student("otheraidrillstudent")
        provider_a = StubProvider(VALID_DRILL_JSON)
        provider_b = StubProvider(VALID_DRILL_JSON.replace("Startup Funding", "Team Conflict"))

        with patch("daily_drill.ai_generation.get_provider", return_value=provider_a):
            generation_a = get_or_create_ai_drill(self.student, self.today)
        with patch("daily_drill.ai_generation.get_provider", return_value=provider_b):
            generation_b = get_or_create_ai_drill(other_student, self.today)

        self.assertNotEqual(generation_a.pk, generation_b.pk)
        self.assertNotEqual(generation_a.topic, generation_b.topic)

    def test_same_student_different_dates_both_persist(self):
        # Distinct content per date so the day-to-day variation retry (tested
        # separately below) doesn't fire and conflate with what's being
        # checked here: that two different dates persist as two rows.
        second_day_json = VALID_DRILL_JSON.replace("Startup Funding", "Team Conflict").replace(
            "An alumnus offers $50,000 for 45% equity with a veto right. What do you do?",
            "A teammate keeps missing deadlines. What do you do?",
        )
        provider = SequencedProvider([VALID_DRILL_JSON, second_day_json])
        tomorrow = self.today + timezone.timedelta(days=1)
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            get_or_create_ai_drill(self.student, self.today)
            get_or_create_ai_drill(self.student, tomorrow)

        self.assertEqual(AIDrillGeneration.objects.filter(student=self.student).count(), 2)
        self.assertEqual(provider.call_count, 2)

    def test_invalid_json_output_is_rejected_and_returns_none(self):
        provider = StubProvider("not valid json at all")
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            generation = get_or_create_ai_drill(self.student, self.today)

        self.assertIsNone(generation)
        self.assertEqual(AIDrillGeneration.objects.count(), 0)

    def test_provider_error_is_handled_gracefully(self):
        provider = StubProvider(None, raises=ProviderError("bad key"))
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            generation = get_or_create_ai_drill(self.student, self.today)

        self.assertIsNone(generation)
        self.assertEqual(AIDrillGeneration.objects.count(), 0)

    def test_too_few_options_rejected(self):
        bad_json = json.dumps(
            {
                "title": "t", "question": "q", "context": "c",
                "options": [{"key": "A", "text": "only one"}],
                "correct_answer": "A", "explanation": "e", "difficulty": "EASY", "topic": "t",
            }
        )
        provider = StubProvider(bad_json)
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            generation = get_or_create_ai_drill(self.student, self.today)

        self.assertIsNone(generation)

    def test_correct_answer_not_matching_any_option_is_repaired_not_rejected(self):
        bad_json = json.dumps(
            {
                "title": "t", "question": "q", "context": "c",
                "options": [
                    {"key": "A", "text": "one"}, {"key": "B", "text": "two"}, {"key": "C", "text": "three"},
                ],
                "correct_answer": "Z", "explanation": "e", "difficulty": "EASY", "topic": "t",
            }
        )
        provider = StubProvider(bad_json)
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            generation = get_or_create_ai_drill(self.student, self.today)

        self.assertIsNotNone(generation)
        self.assertEqual(generation.correct_answer, "A")


class SequencedProvider:
    """Returns a different response text on each successive call — used to
    prove a retry actually happened and used the second response."""

    def __init__(self, texts):
        self.texts = texts
        self.call_count = 0

    def generate_course(self, prompt, response_schema, timeout):
        text = self.texts[self.call_count]
        self.call_count += 1
        return ProviderResult(text=text, input_tokens=50, output_tokens=80)


class GenerateAIDrillVariationTests(TestCase):
    def setUp(self):
        self.student = make_student("varietystudent")
        self.today = timezone.localdate()

    def test_repeat_topic_triggers_one_retry_for_variety(self):
        drill_data = json.loads(VALID_DRILL_JSON)
        duplicate_fingerprint = _fingerprint(drill_data["topic"], drill_data["question"])

        # A drill with the exact same topic+question was already served
        # recently — this is the collision generate_ai_drill must notice.
        AIDrillGeneration.objects.create(
            student=self.student,
            drill_date=self.today - timezone.timedelta(days=1),
            title=drill_data["title"],
            question=drill_data["question"],
            options=drill_data["options"],
            correct_answer=drill_data["correct_answer"],
            difficulty=drill_data["difficulty"],
            topic=drill_data["topic"],
            content_fingerprint=duplicate_fingerprint,
        )

        different_topic_json = VALID_DRILL_JSON.replace("Startup Funding", "Team Conflict").replace(
            "An alumnus offers $50,000 for 45% equity with a veto right. What do you do?",
            "A teammate keeps missing deadlines. What do you do?",
        )
        provider = SequencedProvider([VALID_DRILL_JSON, different_topic_json])

        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            generation = generate_ai_drill(self.student, self.today)

        self.assertEqual(provider.call_count, 2)
        self.assertEqual(generation["topic"], "Team Conflict")

    def test_no_collision_calls_provider_only_once(self):
        provider = SequencedProvider([VALID_DRILL_JSON])
        with patch("daily_drill.ai_generation.get_provider", return_value=provider):
            generation = generate_ai_drill(self.student, self.today)

        self.assertEqual(provider.call_count, 1)
        self.assertEqual(generation["topic"], "Startup Funding")
