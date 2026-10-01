from django.db import IntegrityError
from django.test import TestCase

from common.models import Status
from courses.models import Category, Course


class CategoryModelTests(TestCase):
    def test_slug_auto_generated_from_name(self):
        category = Category.objects.create(name="Web Development")

        self.assertEqual(category.slug, "web-development")

    def test_slug_not_overridden_when_provided(self):
        category = Category.objects.create(name="Data Science", slug="custom-slug")

        self.assertEqual(category.slug, "custom-slug")

    def test_name_must_be_unique(self):
        Category.objects.create(name="Design")

        with self.assertRaises(IntegrityError):
            Category.objects.create(name="Design")

    def test_str_representation(self):
        category = Category.objects.create(name="Marketing")

        self.assertEqual(str(category), "Marketing")


class CourseModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")

    def test_slug_auto_generated_from_title(self):
        course = Course.objects.create(title="Intro to Python", category=self.category)

        self.assertEqual(course.slug, "intro-to-python")

    def test_default_status_is_draft(self):
        course = Course.objects.create(title="Advanced Django", category=self.category)

        self.assertEqual(course.status, Status.DRAFT)

    def test_status_can_be_set_to_any_choice(self):
        course = Course.objects.create(
            title="Published Course", category=self.category, status=Status.PUBLISHED
        )

        self.assertEqual(course.status, Status.PUBLISHED)

    def test_slug_must_be_unique(self):
        Course.objects.create(title="Unique Course", category=self.category)

        with self.assertRaises(IntegrityError):
            Course.objects.create(title="Unique Course", category=self.category)

    def test_deleting_category_with_courses_is_protected(self):
        Course.objects.create(title="Protected Course", category=self.category)

        with self.assertRaises(Exception):
            self.category.delete()

    def test_str_representation(self):
        course = Course.objects.create(title="Machine Learning", category=self.category)

        self.assertEqual(str(course), "Machine Learning")


class ParseGradeRangeTests(TestCase):
    def test_parses_ranges_singles_and_special_grades(self):
        from courses.grades import parse_grade_range

        self.assertEqual(parse_grade_range("x · Grades 9–12 · y"), (9, 12))
        self.assertEqual(parse_grade_range("x · Grades K–2 · y"), (0, 2))
        self.assertEqual(parse_grade_range("x · Grades Pre-K · y"), (-1, -1))
        self.assertEqual(parse_grade_range("x · Grades 6 · y"), (6, 6))
        self.assertEqual(parse_grade_range("x · Grades 1-3 · y"), (1, 3))

    def test_prefers_structured_segment_over_incidental_mentions(self):
        from courses.grades import parse_grade_range

        text = "Grade 8 math prep.\n\nProvider: X · 1 credit · Grades 7–9 · Subject: Math"
        self.assertEqual(parse_grade_range(text), (7, 9))

    def test_returns_none_without_grades_or_when_out_of_range(self):
        from courses.grades import parse_grade_range

        self.assertIsNone(parse_grade_range("A course about gradesmanship."))
        self.assertIsNone(parse_grade_range("· Grades 15 ·"))
        self.assertIsNone(parse_grade_range(""))
