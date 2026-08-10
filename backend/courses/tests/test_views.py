from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course

UserModel = get_user_model()


class CategoryListCreateViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("category-list-create")
        self.user = UserModel.objects.create_user(
            username="categoryuser",
            email="categoryuser@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )
        self.admin = UserModel.objects.create_user(
            username="categoryadmin",
            email="categoryadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_categories(self):
        Category.objects.create(name="Design")
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Categories fetched successfully")

    def test_create_valid_data_returns_201(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(self.url, {"name": "Marketing"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Category.objects.filter(name="Marketing").exists())

    def test_create_duplicate_name_returns_400(self):
        Category.objects.create(name="Marketing")
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(self.url, {"name": "Marketing"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CategoryDetailViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Design")
        self.url = reverse("category-detail", kwargs={"pk": self.category.pk})
        self.user = UserModel.objects.create_user(
            username="categorydetailuser",
            email="categorydetailuser@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )
        self.admin = UserModel.objects.create_user(
            username="categorydetailadmin",
            email="categorydetailadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )

    def test_retrieve_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_returns_category(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["name"], "Design")

    def test_update_category(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(self.url, {"name": "Design Updated"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.category.refresh_from_db()
        self.assertEqual(self.category.name, "Design Updated")

    def test_delete_category(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Category.objects.filter(id=self.category.id).exists())


class CourseListCreateViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("course-list-create")
        self.category = Category.objects.create(name="Programming")
        self.user = UserModel.objects.create_user(
            username="courseuser",
            email="courseuser@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )
        self.admin = UserModel.objects.create_user(
            username="courseadmin",
            email="courseadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_courses(self):
        Course.objects.create(title="Intro to Python", category=self.category)
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Courses fetched successfully")

    def test_create_valid_data_returns_201(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url, {"title": "Advanced Django", "category": self.category.id}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Course.objects.filter(title="Advanced Django").exists())

    def test_create_duplicate_title_returns_400(self):
        Course.objects.create(title="Advanced Django", category=self.category)
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url, {"title": "Advanced Django", "category": self.category.id}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_forbidden_for_non_admin(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url, {"title": "Advanced Django", "category": self.category.id}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Course.objects.filter(title="Advanced Django").exists())


class PublicCourseListViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("course-public-list")
        self.category = Category.objects.create(name="Programming")
        Course.objects.create(
            title="Published Course", code="PUB101", category=self.category, status=Status.PUBLISHED
        )
        Course.objects.create(
            title="Draft Course", code="DRAFT101", category=self.category, status=Status.DRAFT
        )

    def test_list_does_not_require_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_only_returns_published_courses(self):
        response = self.client.get(self.url)

        results = response.data["data"]["results"]
        titles = [item["title"] for item in results]
        self.assertIn("Published Course", titles)
        self.assertNotIn("Draft Course", titles)

    def test_list_does_not_expose_instructors(self):
        response = self.client.get(self.url)

        results = response.data["data"]["results"]
        self.assertNotIn("instructors", results[0])
        self.assertNotIn("status", results[0])


class CourseDetailViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.url = reverse("course-detail", kwargs={"pk": self.course.pk})
        self.user = UserModel.objects.create_user(
            username="coursedetailuser",
            email="coursedetailuser@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )
        self.admin = UserModel.objects.create_user(
            username="coursedetailadmin",
            email="coursedetailadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )

    def test_retrieve_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_returns_course(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["title"], "Intro to Python")

    def test_update_course_status(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            self.url, {"status": Status.PUBLISHED, "category": self.category.id}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.status, Status.PUBLISHED)

    def test_delete_course(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Course.objects.filter(id=self.course.id).exists())
