"""Repairing what the model actually sends back.

A structured-output schema is a request, not a guarantee. Each case here is a
shape a real model has produced against a schema that forbade it, and the
rule throughout is that content which is plainly there is kept — a class
should not lose its notes because a list arrived as a string.
"""

from django.test import SimpleTestCase

from ..notes_validators import normalize_notes_payload

GOOD = {
    "has_content": True,
    "title": "Database Normalization",
    "summary": "The class covered first and second normal form.",
    "key_topics": ["First normal form", "Second normal form"],
    "important_points": [
        {"point": "1NF removes repeating groups", "detail": "Each cell holds one value."}
    ],
    "action_items": [
        {"task": "Complete the exercises", "owner": "All students", "due": "Friday"}
    ],
    "next_class": "Third normal form.",
}


class NormalizeTests(SimpleTestCase):
    def test_a_well_formed_payload_survives_unchanged(self):
        result = normalize_notes_payload(GOOD)
        self.assertEqual(result["title"], "Database Normalization")
        self.assertEqual(result["key_topics"], GOOD["key_topics"])
        self.assertEqual(result["important_points"], GOOD["important_points"])
        self.assertEqual(result["action_items"], GOOD["action_items"])
        self.assertTrue(result["has_content"])

    def test_every_field_is_present_whatever_arrived(self):
        """The PDF renderer and the frontend both index these directly."""
        result = normalize_notes_payload({})
        self.assertEqual(
            sorted(result),
            [
                "action_items",
                "has_content",
                "important_points",
                "key_topics",
                "next_class",
                "summary",
                "title",
            ],
        )
        self.assertEqual(result["key_topics"], [])
        self.assertEqual(result["important_points"], [])

    def test_a_whole_answer_nested_under_one_key_is_unwrapped(self):
        result = normalize_notes_payload({"meeting_notes": GOOD})
        self.assertEqual(result["summary"], GOOD["summary"])

    def test_a_list_sent_as_a_string_is_split_rather_than_dropped(self):
        result = normalize_notes_payload(
            {**GOOD, "key_topics": "First normal form\nSecond normal form"}
        )
        self.assertEqual(
            result["key_topics"], ["First normal form", "Second normal form"]
        )

    def test_action_items_sent_as_bare_strings_keep_their_homework(self):
        """A model that answered `["Read chapter 4"]` meant exactly that, and
        refusing it would throw away real homework."""
        result = normalize_notes_payload({**GOOD, "action_items": ["Read chapter 4"]})
        self.assertEqual(result["action_items"][0]["task"], "Read chapter 4")
        self.assertEqual(result["action_items"][0]["owner"], "All students")
        self.assertEqual(result["action_items"][0]["due"], "")

    def test_an_entry_missing_its_required_field_is_dropped(self):
        result = normalize_notes_payload(
            {**GOOD, "important_points": [{"detail": "an explanation of nothing"}]}
        )
        self.assertEqual(result["important_points"], [])

    def test_duplicated_topics_collapse(self):
        result = normalize_notes_payload({**GOOD, "key_topics": ["1NF", "1NF", "2NF"]})
        self.assertEqual(result["key_topics"], ["1NF", "2NF"])

    def test_a_runaway_list_is_truncated(self):
        result = normalize_notes_payload(
            {**GOOD, "key_topics": [f"topic {n}" for n in range(500)]}
        )
        self.assertEqual(len(result["key_topics"]), 20)

    def test_the_scheduled_title_fills_in_for_a_missing_one(self):
        result = normalize_notes_payload(
            {**GOOD, "title": ""}, fallback_title="Film Review: Week 4"
        )
        self.assertEqual(result["title"], "Film Review: Week 4")

    def test_an_explicit_false_is_the_only_thing_that_hides_the_notes(self):
        """A missing boolean must never put a real write-up behind the
        "nothing was taught" screen — the reverse mistake is cheap."""
        self.assertTrue(normalize_notes_payload(GOOD)["has_content"])
        self.assertTrue(
            normalize_notes_payload({**GOOD, "has_content": None})["has_content"]
        )
        self.assertFalse(
            normalize_notes_payload({**GOOD, "has_content": False})["has_content"]
        )

    def test_no_summary_is_no_content_whatever_the_flag_says(self):
        """The one thing never repaired: there is nothing to publish."""
        self.assertFalse(
            normalize_notes_payload({**GOOD, "summary": ""})["has_content"]
        )

    def test_a_non_dict_payload_does_not_crash(self):
        for payload in ([], "notes", None, 7):
            self.assertFalse(normalize_notes_payload(payload)["has_content"])
