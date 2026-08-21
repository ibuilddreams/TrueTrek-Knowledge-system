import json

from django.test import SimpleTestCase

from ai_courses.validators import PlanValidationError, validate_and_repair

FORM_PAYLOAD = {
    "modules_count": 3,
    "lessons_per_module": 2,
    "include_quizzes": True,
    "questions_per_quiz": 5,
    "include_assignments": True,
    "objectives": [],
}


def _plan(modules):
    return json.dumps({"summary": "A course.", "objectives": ["Learn things"], "modules": modules})


def _module(title="Module", items=None):
    return {"title": title, "description": "desc", "items": items or []}


def _lesson(title="Lesson", body="Some real teaching content here."):
    return {"kind": "lesson", "title": title, "body": body, "estimated_minutes": 10}


class ValidateAndRepairTests(SimpleTestCase):
    def test_malformed_json_raises(self):
        with self.assertRaises(PlanValidationError):
            validate_and_repair("not json", FORM_PAYLOAD, max_modules=12)

    def test_no_modules_raises(self):
        with self.assertRaises(PlanValidationError):
            validate_and_repair(_plan([]), FORM_PAYLOAD, max_modules=12)

    def test_module_with_no_lessons_is_dropped(self):
        modules = [
            _module(items=[_lesson()]),
            _module(items=[{"kind": "quiz", "questions": []}]),
        ]
        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertEqual(len(normalized["modules"]), 1)
        self.assertTrue(any("dropped" in w for w in warnings))

    def test_all_modules_dropped_raises(self):
        modules = [_module(items=[{"kind": "quiz", "questions": []}])]
        with self.assertRaises(PlanValidationError):
            validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

    def test_choice_text_truncated_to_255(self):
        long_text = "x" * 300
        question = {
            "text": "Pick one",
            "question_type": "MCQ",
            "marks": 1,
            "choices": [{"text": long_text, "is_correct": True}, {"text": "short", "is_correct": False}],
        }
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        choice_text = normalized["modules"][0]["quiz"]["questions"][0]["choices"]
        self.assertTrue(all(len(choice["text"]) <= 255 for choice in choice_text))
        self.assertTrue(any("truncated" in w for w in warnings))

    def test_mcq_with_zero_correct_gets_first_marked_correct(self):
        question = {
            "text": "Pick one",
            "question_type": "MCQ",
            "marks": 1,
            "choices": [{"text": "A", "is_correct": False}, {"text": "B", "is_correct": False}],
        }
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        choices = normalized["modules"][0]["quiz"]["questions"][0]["choices"]
        self.assertEqual(sum(1 for c in choices if c["is_correct"]), 1)
        self.assertTrue(any("no correct choice" in w for w in warnings))

    def test_mcq_with_all_correct_keeps_only_one(self):
        question = {
            "text": "Pick one",
            "question_type": "MCQ",
            "marks": 1,
            "choices": [{"text": "A", "is_correct": True}, {"text": "B", "is_correct": True}],
        }
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        choices = normalized["modules"][0]["quiz"]["questions"][0]["choices"]
        self.assertEqual(sum(1 for c in choices if c["is_correct"]), 1)
        self.assertTrue(any("multiple correct" in w for w in warnings))

    def test_mcq_with_one_choice_is_dropped(self):
        question = {
            "text": "Pick one",
            "question_type": "MCQ",
            "marks": 1,
            "choices": [{"text": "A", "is_correct": True}],
        }
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertIsNone(normalized["modules"][0]["quiz"])
        self.assertTrue(any("dropped" in w for w in warnings))

    def test_true_false_requires_exactly_two_choices(self):
        question = {
            "text": "True or false?",
            "question_type": "TRUE_FALSE",
            "marks": 1,
            "choices": [
                {"text": "True", "is_correct": True},
                {"text": "False", "is_correct": False},
                {"text": "Maybe", "is_correct": False},
            ],
        }
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertIsNone(normalized["modules"][0]["quiz"])
        self.assertTrue(any("exactly 2 choices" in w for w in warnings))

    def test_blank_question_text_is_dropped(self):
        question = {"text": "  ", "question_type": "MCQ", "marks": 1, "choices": []}
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertIsNone(normalized["modules"][0]["quiz"])
        self.assertTrue(any("blank text" in w for w in warnings))

    def test_marks_zero_is_clamped_to_one(self):
        question = {
            "text": "Q",
            "question_type": "MCQ",
            "marks": 0,
            "choices": [{"text": "A", "is_correct": True}, {"text": "B", "is_correct": False}],
        }
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, _ = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertEqual(normalized["modules"][0]["quiz"]["questions"][0]["marks"], 1)

    def test_long_title_truncated(self):
        modules = [_module(title="x" * 400, items=[_lesson()])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertEqual(len(normalized["modules"][0]["title"]), 255)
        self.assertTrue(any("truncated" in w for w in warnings))

    def test_injected_status_and_code_fields_are_simply_ignored(self):
        modules = [_module(items=[_lesson()])]
        modules[0]["status"] = "PUBLISHED"
        modules[0]["code"] = "HACKED"

        normalized, _ = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertNotIn("status", normalized["modules"][0])
        self.assertNotIn("code", normalized["modules"][0])

    def test_module_count_capped_at_max_modules(self):
        modules = [_module(title=f"Module {i}", items=[_lesson()]) for i in range(5)]
        payload = {**FORM_PAYLOAD, "modules_count": 12}

        normalized, warnings = validate_and_repair(_plan(modules), payload, max_modules=3)

        self.assertEqual(len(normalized["modules"]), 3)
        self.assertTrue(any("extra modules" in w for w in warnings))

    def test_short_answer_question_discards_choices(self):
        question = {
            "text": "Explain briefly",
            "question_type": "SHORT_ANSWER",
            "marks": 2,
            "choices": [{"text": "irrelevant", "is_correct": True}],
        }
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": [question]}])]

        normalized, warnings = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        self.assertEqual(normalized["modules"][0]["quiz"]["questions"][0]["choices"], [])
        self.assertTrue(any("choices were discarded" in w for w in warnings))

    def test_correct_answer_position_is_rotated_across_questions(self):
        def question(n):
            return {
                "text": f"Q{n}",
                "question_type": "MCQ",
                "marks": 1,
                "choices": [
                    {"text": "correct", "is_correct": True},
                    {"text": "b", "is_correct": False},
                    {"text": "c", "is_correct": False},
                ],
            }

        questions = [question(i) for i in range(1, 4)]
        modules = [_module(items=[_lesson(), {"kind": "quiz", "questions": questions}])]

        normalized, _ = validate_and_repair(_plan(modules), FORM_PAYLOAD, max_modules=12)

        positions = [
            next(i for i, c in enumerate(q["choices"]) if c["is_correct"])
            for q in normalized["modules"][0]["quiz"]["questions"]
        ]
        # Not every question should have the correct answer in the same slot.
        self.assertTrue(len(set(positions)) > 1)
