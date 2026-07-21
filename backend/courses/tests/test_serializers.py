from django.test import TestCase

from courses.models import Category, Course
from courses.serializers import (
    CategorySerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    CourseWriteSerializer,
)
from common.models import Status


class CategorySerializerTests(TestCase):
    def test_valid_data_creates_category(self):
        serializer = CategorySerializer(data={"name": "Design"})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        category = serializer.save()

        self.assertEqual(category.slug, "design")

    def test_slug_is_read_only(self):
        serializer = CategorySerializer(data={"name": "Design", "slug": "custom"})
        serializer.is_valid(raise_exception=True)
        category = serializer.save()

        self.assertEqual(category.slug, "design")


class CourseWriteSerializerTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")

    def test_valid_data_creates_course(self):
        serializer = CourseWriteSerializer(
            data={"title": "Intro to Python", "category": self.category.id}
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        course = serializer.save()

        self.assertEqual(course.status, Status.DRAFT)

    def test_duplicate_title_rejected(self):
        Course.objects.create(title="Existing Course", category=self.category)

        serializer = CourseWriteSerializer(
            data={"title": "Existing Course", "category": self.category.id}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("title", serializer.errors)

    def test_duplicate_title_allowed_on_same_instance(self):
        course = Course.objects.create(title="Existing Course", category=self.category)

        serializer = CourseWriteSerializer(
            instance=course,
            data={"title": "Existing Course", "category": self.category.id, "status": Status.PUBLISHED},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)


class CourseListSerializerTests(TestCase):
    def test_nested_category_representation(self):
        category = Category.objects.create(name="Programming")
        course = Course.objects.create(title="Intro to Python", category=category)

        serializer = CourseListSerializer(course)

        self.assertEqual(serializer.data["category"]["name"], "Programming")
        self.assertNotIn("description", serializer.data)


class CourseDetailSerializerTests(TestCase):
    def test_includes_description(self):
        category = Category.objects.create(name="Programming")
        course = Course.objects.create(
            title="Intro to Python", category=category, description="Learn the basics"
        )

        serializer = CourseDetailSerializer(course)

        self.assertEqual(serializer.data["description"], "Learn the basics")
