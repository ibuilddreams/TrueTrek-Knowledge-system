from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course
from enrollments.models import Enrollment

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

    def test_delete_category_still_in_use_returns_409_instead_of_500(self):
        Course.objects.create(title="Intro to Design", code="DES101", category=self.category)
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("course", response.data["message"].lower())
        self.assertTrue(Category.objects.filter(id=self.category.id).exists())


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

    def test_exclude_enrolled_has_no_effect_for_guests(self):
        response = self.client.get(self.url, {"exclude_enrolled": "true"})

        titles = [item["title"] for item in response.data["data"]["results"]]
        self.assertIn("Published Course", titles)

    def test_exclude_enrolled_hides_courses_the_student_already_has(self):
        from enrollments.models import Enrollment

        student = UserModel.objects.create_user(
            username="storestudent",
            email="storestudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        enrolled_course = Course.objects.get(title="Published Course")
        Enrollment.objects.create(student=student, course=enrolled_course)
        self.client.force_authenticate(user=student)

        response = self.client.get(self.url, {"exclude_enrolled": "true"})

        titles = [item["title"] for item in response.data["data"]["results"]]
        self.assertNotIn("Published Course", titles)

    def test_without_exclude_enrolled_param_shows_everything_for_students_too(self):
        from enrollments.models import Enrollment

        student = UserModel.objects.create_user(
            username="curriculumstudent",
            email="curriculumstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        enrolled_course = Course.objects.get(title="Published Course")
        Enrollment.objects.create(student=student, course=enrolled_course)
        self.client.force_authenticate(user=student)

        response = self.client.get(self.url)

        titles = [item["title"] for item in response.data["data"]["results"]]
        self.assertIn("Published Course", titles)


class PublicCourseGradeFilterTests(APITestCase):
    def setUp(self):
        self.url = reverse("course-public-list")
        self.filters_url = reverse("course-public-filters")
        self.category = Category.objects.create(name="Mathematics")
        self.early = Course.objects.create(
            title="Early Math",
            code="EARLY1",
            category=self.category,
            status=Status.PUBLISHED,
            difficulty=Course.Difficulty.BEGINNER,
            description="Counting.\n\nProvider: X · 1 credit · Grades K–2 · Subject: Mathematics",
        )
        self.high = Course.objects.create(
            title="High School Math",
            code="HIGH1",
            category=self.category,
            status=Status.PUBLISHED,
            difficulty=Course.Difficulty.ADVANCED,
            description="Algebra.\n\nProvider: X · 1 credit · Grades 9–12 · Subject: Mathematics",
        )
        Course.objects.create(
            title="No Grade", code="NOGRADE1", category=self.category, status=Status.PUBLISHED
        )
        Course.objects.create(
            title="Draft Grade",
            code="DRAFTG1",
            category=self.category,
            status=Status.DRAFT,
            description="· Grades 3 ·",
        )

    def _titles(self, **params):
        response = self.client.get(self.url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return [item["title"] for item in response.data["data"]["results"]]

    def test_grade_range_is_parsed_on_save(self):
        self.assertEqual((self.early.grade_min, self.early.grade_max), (0, 2))
        self.assertEqual(self.early.grade_label, "Grades K–2")

    def test_grade_filter_matches_courses_whose_range_includes_the_grade(self):
        self.assertEqual(self._titles(grade="1"), ["Early Math"])
        self.assertEqual(self._titles(grade="0"), ["Early Math"])
        self.assertEqual(self._titles(grade="12"), ["High School Math"])

    def test_grade_filter_with_no_match_or_invalid_value_returns_nothing(self):
        self.assertEqual(self._titles(grade="5"), [])
        self.assertEqual(self._titles(grade="abc"), [])
        self.assertEqual(self._titles(grade="99"), [])

    def test_difficulty_filter(self):
        self.assertEqual(self._titles(difficulty="advanced"), ["High School Math"])

    def test_filters_endpoint_lists_available_grades_and_difficulties(self):
        data = self.client.get(self.filters_url).data["data"]

        grade_values = [grade["value"] for grade in data["grades"]]
        self.assertEqual(grade_values, [0, 1, 2, 9, 10, 11, 12])
        self.assertEqual(data["grades"][0]["label"], "Kindergarten")
        self.assertEqual(
            [difficulty["value"] for difficulty in data["difficulties"]],
            ["BEGINNER", "ADVANCED"],
        )

    def test_list_exposes_grade_label(self):
        response = self.client.get(self.url, {"grade": "10"})

        self.assertEqual(response.data["data"]["results"][0]["grade_label"], "Grades 9–12")


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


class PublicCourseRecommendationsViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("course-public-recommendations")
        programming = Category.objects.create(name="Programming")
        art = Category.objects.create(name="Art")
        self.cart_course = Course.objects.create(
            title="Cart Course", code="CART1", category=programming, status=Status.PUBLISHED
        )
        self.related_course = Course.objects.create(
            title="Related Course", code="REL1", category=programming, status=Status.PUBLISHED
        )
        self.popular_course = Course.objects.create(
            title="Popular Course", code="POP1", category=art, status=Status.PUBLISHED
        )
        Course.objects.create(
            title="Draft Course", code="DRF1", category=programming, status=Status.DRAFT
        )
        self.student = UserModel.objects.create_user(
            username="buyer", email="buyer@example.com", password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )
        other = UserModel.objects.create_user(
            username="other", email="other@example.com", password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )
        Enrollment.objects.create(student=other, course=self.popular_course)

    def _ids(self, response, key):
        return [course["id"] for course in response.data["data"][key]]

    def test_does_not_require_authentication(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

    def test_related_matches_cart_category_and_excludes_cart_and_drafts(self):
        response = self.client.get(self.url, {"course_ids": str(self.cart_course.id)})

        self.assertEqual(self._ids(response, "related"), [self.related_course.id])

    def test_related_is_empty_without_cart(self):
        self.assertEqual(self._ids(self.client.get(self.url), "related"), [])

    def test_popular_with_cart_only_includes_purchased_courses_with_count(self):
        response = self.client.get(self.url, {"course_ids": str(self.cart_course.id)})

        self.assertEqual(self._ids(response, "popular"), [self.popular_course.id])
        self.assertEqual(response.data["data"]["popular"][0]["purchase_count"], 1)

    def test_popular_without_cart_falls_back_to_all_published_courses(self):
        response = self.client.get(self.url)

        ids = self._ids(response, "popular")
        self.assertEqual(ids[0], self.popular_course.id)
        self.assertEqual(
            set(ids), {self.cart_course.id, self.related_course.id, self.popular_course.id}
        )

    def test_cancelled_enrollments_do_not_count(self):
        Enrollment.objects.filter(course=self.popular_course).update(
            status=Enrollment.EnrollmentStatus.CANCELLED
        )

        response = self.client.get(self.url, {"course_ids": str(self.cart_course.id)})

        self.assertEqual(self._ids(response, "popular"), [])

    def test_excludes_courses_authenticated_student_is_enrolled_in(self):
        Enrollment.objects.create(student=self.student, course=self.popular_course)
        self.client.force_authenticate(self.student)

        response = self.client.get(self.url, {"course_ids": str(self.cart_course.id)})

        self.assertEqual(self._ids(response, "popular"), [])

    def test_ignores_malformed_ids_and_limit(self):
        response = self.client.get(self.url, {"course_ids": "abc,,x1", "limit": "zzz"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CourseLearningOutcomesTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.admin = UserModel.objects.create_user(
            username="outcomesadmin", email="outcomesadmin@example.com", password="StrongPass123!",
            role=UserModel.Roles.ADMIN, gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="outcomesteacher", email="outcomesteacher@example.com", password="StrongPass123!",
            role=UserModel.Roles.TEACHER, gender=UserModel.Gender.MALE,
        )

    def _payload(self, **extra):
        return {"title": "Outcome Course", "code": "OUT101", "category": self.category.id, **extra}

    def test_admin_can_create_with_outcomes_as_json_list(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            reverse("course-list-create"),
            self._payload(learning_outcomes=["  Build apps ", "", "Ship   code"]),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["learning_outcomes"], ["Build apps", "Ship code"])

    def test_multipart_form_accepts_outcomes_as_json_string(self):
        self.client.force_authenticate(self.teacher)

        response = self.client.post(
            reverse("course-list-create"),
            self._payload(learning_outcomes='["Learn A", "Learn B"]'),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["learning_outcomes"], ["Learn A", "Learn B"])

    def test_rejects_too_many_or_too_long_points(self):
        self.client.force_authenticate(self.admin)
        url = reverse("course-list-create")

        too_many = self.client.post(
            url,
            self._payload(learning_outcomes=[f"Point {i}" for i in range(13)]),
            format="json",
        )
        too_long = self.client.post(
            url, self._payload(code="OUT102", title="Other", learning_outcomes=["x" * 301]), format="json"
        )
        not_text = self.client.post(
            url, self._payload(code="OUT103", title="Third", learning_outcomes=[1]), format="json"
        )

        self.assertEqual(too_many.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(too_long.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(not_text.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_update_outcomes(self):
        course = Course.objects.create(
            title="Editable", code="EDT1", category=self.category, status=Status.PUBLISHED
        )
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            reverse("course-detail", args=[course.id]), {"learning_outcomes": ["New point"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        course.refresh_from_db()
        self.assertEqual(course.learning_outcomes, ["New point"])

    def test_public_detail_exposes_outcomes_and_instructor_names_only(self):
        from courses.models import CourseInstructor

        course = Course.objects.create(
            title="Public One", code="PUB9", category=self.category, status=Status.PUBLISHED,
            learning_outcomes=["Learn this"],
        )
        CourseInstructor.objects.create(course=course, instructor=self.teacher, is_lead=True)

        response = self.client.get(reverse("course-public-detail", args=[course.slug]))

        data = response.data["data"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["learning_outcomes"], ["Learn this"])
        self.assertEqual(data["purchase_count"], 0)
        self.assertEqual(set(data["instructors"][0].keys()), {"id", "user_id", "name", "is_lead", "headline", "bio", "avatar", "stats"})
        self.assertNotIn("outcomesteacher@example.com", str(data))
