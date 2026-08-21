from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from ai_courses.writer import write_course_tree
from assignments.models import Assignment
from common.models import Status
from courses.models import Category, Course, CourseInstructor
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Choice, Question, Quiz

UserModel = get_user_model()


def _teacher(email="teacher@example.com"):
    return UserModel.objects.create_user(
        username=email,
        email=email,
        password="StrongPass123!",
        role=UserModel.Roles.TEACHER,
        gender=UserModel.Gender.OTHER,
    )


def _normalized_plan(module_count=2):
    modules = []
    for i in range(1, module_count + 1):
        modules.append(
            {
                "title": f"Module {i}",
                "description": "desc",
                "lessons": [
                    {"title": f"Lesson {i}.1", "body": "Teaching content.", "estimated_minutes": 15},
                    {"title": f"Lesson {i}.2", "body": "More content.", "estimated_minutes": 20},
                ],
                "quiz": {
                    "questions": [
                        {
                            "text": "Q1",
                            "question_type": "MCQ",
                            "marks": 1,
                            "choices": [
                                {"text": "Right", "is_correct": True},
                                {"text": "Wrong", "is_correct": False},
                            ],
                        }
                    ]
                },
                "assignment": {"instructions": "Do the thing."},
            }
        )
    return {"summary": "A generated course.", "objectives": ["Learn"], "modules": modules}


class WriteCourseTreeTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="AI Test Category")
        self.teacher = _teacher()

    def _form_payload(self, **overrides):
        payload = {
            "title": "Generated Course",
            "description": "",
            "category": self.category,
            "difficulty": Course.Difficulty.BEGINNER,
            "amount": Decimal("0"),
            "instructors": [self.teacher],
            "weeks_between_modules": 2,
        }
        payload.update(overrides)
        return payload

    def test_writes_full_tree_with_correct_orders(self):
        course = write_course_tree(_normalized_plan(2), self._form_payload())

        self.assertEqual(course.status, Status.DRAFT)
        self.assertTrue(CourseInstructor.objects.filter(course=course, instructor=self.teacher, is_lead=True).exists())

        modules = list(Module.objects.filter(course=course).order_by("order"))
        self.assertEqual([m.order for m in modules], [1, 2])

        for module in modules:
            lessons = list(Lesson.objects.filter(module=module).order_by("order"))
            self.assertEqual([l.order for l in lessons], [1, 2])
            self.assertTrue(all(l.content_type == Lesson.ContentType.TEXT for l in lessons))
            self.assertTrue(all(l.content_data for l in lessons))

            quiz = Quiz.objects.get(module=module)
            self.assertEqual(quiz.status, Status.DRAFT)
            question = Question.objects.get(quiz=quiz)
            self.assertEqual(question.order, 1)
            self.assertEqual(Choice.objects.filter(question=question, is_correct=True).count(), 1)

            assignment = Assignment.objects.get(module=module)
            self.assertEqual(assignment.status, Status.DRAFT)
            self.assertIsNotNone(assignment.due_date)

    def test_duration_minutes_recomputed_from_lessons(self):
        course = write_course_tree(_normalized_plan(1), self._form_payload())
        self.assertEqual(course.duration_minutes, 35)

    def test_code_and_slug_collision_probe_on_regeneration(self):
        first = write_course_tree(_normalized_plan(1), self._form_payload(title="Same Title"))
        second = write_course_tree(_normalized_plan(1), self._form_payload(title="Same Title"))

        self.assertNotEqual(first.code, second.code)
        self.assertNotEqual(first.slug, second.slug)

    def test_failure_mid_write_rolls_back_everything(self):
        plan = _normalized_plan(1)
        plan["modules"][0]["quiz"]["questions"][0]["choices"] = "not-a-list"  # forces a TypeError mid-write

        with self.assertRaises(TypeError):
            write_course_tree(plan, self._form_payload(title="Should Roll Back"))

        self.assertFalse(Course.objects.filter(title="Should Roll Back").exists())
        self.assertFalse(Module.objects.exists())
