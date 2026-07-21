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
