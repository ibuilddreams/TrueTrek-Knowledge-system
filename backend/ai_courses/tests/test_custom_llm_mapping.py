"""Mapping tests: our form -> the service's request, and its job result -> the
plan shape validators/writer already understand.

Pure functions, so no DB and no network. The response half deliberately feeds
several plausible service shapes through, because that is the risk this layer
exists to absorb: a module called `chapters` or a choice list called `options`
must not silently cost the admin a module.
"""

from decimal import Decimal
from types import SimpleNamespace

from django.test import SimpleTestCase

from ai_courses.custom_llm_mapping import (
    adapt_job_result,
    build_request_payload,
    build_tier_context,
)


def _form(**overrides):
    data = {
        "title": "NIL Basics",
        "description": "A short course",
        "category": SimpleNamespace(id=7),
        "difficulty": "ADVANCED",
        "instructors": [SimpleNamespace(id=3), SimpleNamespace(id=4)],
        "amount": "49.99",
        "target_audience": "Student athletes",
        "objectives": ["Read a term sheet", "  "],
        "tier": None,
        "modules_count": 4,
        "lessons_per_module": 3,
        "include_quizzes": True,
        "questions_per_quiz": 6,
        "include_assignments": True,
        "ai_grading": True,
        "weeks_between_modules": 3,
        "additional_instructions": "Use real examples",
    }
    data.update(overrides)
    return data


class RequestPayloadTests(SimpleTestCase):
    def test_every_field_of_the_service_contract_is_sent(self):
        payload = build_request_payload(_form())

        self.assertEqual(
            sorted(payload),
            sorted(
                [
                    "title", "category_id", "instructor_ids", "description",
                    "target_audience", "learning_objectives", "difficulty",
                    "num_modules", "lessons_per_module", "include_quizzes",
                    "questions_per_quiz", "include_assignments", "ai_grading_enabled",
                    "weeks_between_modules", "additional_instructions", "tier_context",
                    "price", "callback_url", "rag_enabled",
                ]
            ),
        )

    def test_ids_are_sent_as_strings_and_blank_text_as_null(self):
        payload = build_request_payload(_form(description="", target_audience="   "))

        self.assertEqual(payload["category_id"], "7")
        self.assertEqual(payload["instructor_ids"], ["3", "4"])
        self.assertIsNone(payload["description"])
        self.assertIsNone(payload["target_audience"])

    def test_difficulty_is_translated_to_the_services_vocabulary(self):
        self.assertEqual(build_request_payload(_form(difficulty="ADVANCED"))["difficulty"], "advanced")
        self.assertEqual(build_request_payload(_form(difficulty="BEGINNER"))["difficulty"], "beginner")
        # An unknown value cannot be passed through — the service only accepts
        # three, and a rejected request would fail the whole generation.
        self.assertEqual(build_request_payload(_form(difficulty="EXPERT"))["difficulty"], "beginner")

    def test_price_survives_the_jsonfield_round_trip_as_a_number(self):
        # amount is stored as a string by services._serialize_input.
        self.assertEqual(build_request_payload(_form(amount="49.99"))["price"], 49.99)
        self.assertEqual(build_request_payload(_form(amount=Decimal("10")))["price"], 10.0)
        self.assertEqual(build_request_payload(_form(amount=None))["price"], 0.0)

    def test_blank_objectives_are_dropped(self):
        self.assertEqual(
            build_request_payload(_form())["learning_objectives"], ["Read a term sheet"]
        )

    def test_ai_grading_defaults_on_for_rows_serialized_before_the_field_existed(self):
        form = _form()
        del form["ai_grading"]
        self.assertTrue(build_request_payload(form)["ai_grading_enabled"])

    def test_tier_is_sent_as_read_only_context_text(self):
        tier = SimpleNamespace(
            name="Foundations", level=1, audience="New athletes", focus_description="Money basics"
        )
        context = build_request_payload(_form(tier=tier))["tier_context"]

        self.assertIn("Foundations (Tier 1)", context)
        self.assertIn("New athletes", context)
        self.assertIn("Money basics", context)

    def test_no_tier_sends_no_context(self):
        self.assertIsNone(build_tier_context(None))

    def test_rag_is_off_unless_the_deployment_asks_for_it(self):
        self.assertFalse(build_request_payload(_form())["rag_enabled"])
        self.assertTrue(build_request_payload(_form(), rag_enabled=True)["rag_enabled"])


class JobResultTests(SimpleTestCase):
    def _adapt(self, body):
        warnings = []
        return adapt_job_result(body, warnings), warnings

    def test_our_own_plan_shape_passes_through_unchanged(self):
        plan, warnings = self._adapt(
            {
                "summary": "s",
                "objectives": ["o"],
                "learning_outcomes": ["Do a thing"],
                "modules": [
                    {
                        "title": "M1",
                        "description": "d",
                        "items": [
                            {"kind": "lesson", "title": "L1", "body": "prose", "estimated_minutes": 10}
                        ],
                    }
                ],
            }
        )

        self.assertEqual(plan["summary"], "s")
        self.assertEqual(plan["objectives"], ["o"])
        self.assertEqual(plan["learning_outcomes"], ["Do a thing"])
        self.assertEqual(plan["modules"][0]["items"][0]["body"], "prose")
        self.assertEqual(warnings, [])

    def test_a_course_nested_in_envelopes_is_found(self):
        plan, _ = self._adapt(
            {
                "job_id": "j1",
                "status": "completed",
                "data": {"result": {"course": {"modules": [{"title": "M1", "lessons": []}]}}},
            }
        )
        self.assertEqual(plan["modules"][0]["title"], "M1")

    def test_chapters_and_topics_are_read_as_modules_and_lessons(self):
        plan, _ = self._adapt(
            {
                "result": {
                    "overview": "About the course",
                    "chapters": [
                        {
                            "name": "Chapter one",
                            "topics": [
                                {"name": "Topic A", "content": "prose", "duration": "45 minutes"}
                            ],
                        }
                    ],
                }
            }
        )

        module = plan["modules"][0]
        self.assertEqual(plan["summary"], "About the course")
        self.assertEqual(module["title"], "Chapter one")
        self.assertEqual(module["items"][0]["kind"], "lesson")
        self.assertEqual(module["items"][0]["title"], "Topic A")
        self.assertEqual(module["items"][0]["estimated_minutes"], 45)

    def test_separate_quiz_and_assignment_collections_become_typed_items(self):
        plan, _ = self._adapt(
            {
                "modules": [
                    {
                        "title": "M1",
                        "lessons": [{"title": "L1", "body": "prose"}],
                        "quiz": {
                            "questions": [
                                {
                                    "question": "Pick one",
                                    "type": "multiple_choice",
                                    "points": 2,
                                    "options": [
                                        {"text": "A", "correct": False},
                                        {"text": "B", "correct": True},
                                    ],
                                }
                            ]
                        },
                        "assignment": {"task": "Write a reflection"},
                    }
                ]
            }
        )

        kinds = [item["kind"] for item in plan["modules"][0]["items"]]
        self.assertEqual(kinds, ["lesson", "quiz", "assignment"])

        question = plan["modules"][0]["items"][1]["questions"][0]
        self.assertEqual(question["text"], "Pick one")
        self.assertEqual(question["question_type"], "MCQ")
        self.assertEqual(question["marks"], 2)
        self.assertEqual(
            question["choices"],
            [{"text": "A", "is_correct": False}, {"text": "B", "is_correct": True}],
        )

        assignment = plan["modules"][0]["items"][2]
        self.assertEqual(assignment["instructions"], "Write a reflection")

    def test_a_correct_answer_given_by_letter_index_or_text_is_resolved(self):
        for answer, expected_index in (("B", 1), (1, 1), ("Paris", 0), ("(c)", 2)):
            plan, warnings = self._adapt(
                {
                    "modules": [
                        {
                            "title": "M1",
                            "quizzes": [
                                {
                                    "question": "Capital?",
                                    "choices": ["Paris", "Lyon", "Nice"],
                                    "correct_answer": answer,
                                }
                            ],
                        }
                    ]
                }
            )
            choices = plan["modules"][0]["items"][0]["questions"][0]["choices"]
            marked = [index for index, choice in enumerate(choices) if choice["is_correct"]]
            self.assertEqual(marked, [expected_index], f"answer={answer!r}")
            self.assertEqual(warnings, [])

    def test_a_bare_list_of_questions_becomes_one_quiz_not_many(self):
        plan, _ = self._adapt(
            {
                "modules": [
                    {
                        "title": "M1",
                        "quizzes": [
                            {"question": "Q1", "options": ["a", "b"], "answer": "a"},
                            {"question": "Q2", "options": ["c", "d"], "answer": "d"},
                        ],
                    }
                ]
            }
        )

        quizzes = [item for item in plan["modules"][0]["items"] if item["kind"] == "quiz"]
        self.assertEqual(len(quizzes), 1)
        self.assertEqual(len(quizzes[0]["questions"]), 2)

    def test_question_types_are_inferred_when_the_service_omits_them(self):
        plan, _ = self._adapt(
            {
                "modules": [
                    {
                        "title": "M1",
                        "quiz": {
                            "questions": [
                                {"question": "Open one", "answer": "anything"},
                                {"question": "T/F?", "choices": ["True", "False"], "answer": True},
                                {"question": "Pick", "choices": ["a", "b", "c"], "answer": "a"},
                            ]
                        },
                    }
                ]
            }
        )

        questions = plan["modules"][0]["items"][0]["questions"]
        self.assertEqual(questions[0]["question_type"], "SHORT_ANSWER")
        self.assertEqual(questions[0]["choices"], [])
        self.assertEqual(questions[1]["question_type"], "TRUE_FALSE")
        self.assertTrue(questions[1]["choices"][0]["is_correct"])
        self.assertEqual(questions[2]["question_type"], "MCQ")

    def test_an_unmarkable_correct_answer_is_reported_rather_than_guessed(self):
        plan, warnings = self._adapt(
            {
                "modules": [
                    {
                        "title": "M1",
                        "quiz": {"questions": [{"question": "Q", "choices": ["a", "b"]}]},
                    }
                ]
            }
        )

        choices = plan["modules"][0]["items"][0]["questions"][0]["choices"]
        self.assertFalse(any(choice["is_correct"] for choice in choices))
        self.assertTrue(any("without a marked correct answer" in w for w in warnings))

    def test_lesson_prose_is_read_from_nested_or_block_content(self):
        plan, _ = self._adapt(
            {
                "modules": [
                    {
                        "title": "M1",
                        "lessons": [
                            {"title": "A", "content": {"markdown": "# Heading"}},
                            {"title": "B", "content": ["para one", "para two"]},
                        ],
                    }
                ]
            }
        )

        bodies = [item["body"] for item in plan["modules"][0]["items"]]
        self.assertEqual(bodies, ["# Heading", "para one\n\npara two"])

    def test_untyped_content_is_imported_as_lessons_with_a_warning(self):
        plan, warnings = self._adapt(
            {"modules": [{"title": "M1", "items": [{"title": "L1", "body": "prose"}]}]}
        )

        self.assertEqual(plan["modules"][0]["items"][0]["kind"], "lesson")
        self.assertTrue(any("without a type" in warning for warning in warnings))

    def test_an_unrecognisable_result_warns_instead_of_raising(self):
        # validate_and_repair is what fails the generation, with its own message —
        # this layer must not invent a second one or crash the worker thread.
        plan, warnings = self._adapt({"job_id": "j1", "status": "completed"})

        self.assertEqual(plan["modules"], [])
        self.assertTrue(any("did not contain" in warning for warning in warnings))

    def test_a_malformed_module_is_dropped_and_reported(self):
        plan, warnings = self._adapt({"modules": ["not a module", {"title": "M1"}]})

        self.assertEqual(len(plan["modules"]), 1)
        self.assertTrue(any("malformed" in warning for warning in warnings))

    def test_learning_outcomes_are_read_from_their_common_spellings(self):
        for key in ("learning_outcomes", "outcomes", "what_you_will_learn", "key_takeaways"):
            plan, _ = self._adapt({key: ["Do a thing"], "modules": [{"title": "M1"}]})
            self.assertEqual(plan["learning_outcomes"], ["Do a thing"], key)
