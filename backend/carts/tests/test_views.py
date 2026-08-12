from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from ..models import CartItem

UserModel = get_user_model()


class CartItemListCreateViewTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("cart-list-create")
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(
            title="Intro to Python",
            code="PY-101",
            category=self.category,
            status=Status.PUBLISHED,
            amount="49.99",
        )
        self.draft_course = Course.objects.create(
            title="Unpublished Course",
            code="DRAFT-101",
            category=self.category,
            status=Status.DRAFT,
        )

        self.student = UserModel.objects.create_user(
            username="cartstudent",
            email="cartstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.other_student = UserModel.objects.create_user(
            username="othercartstudent",
            email="othercartstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="cartteacher",
            email="cartteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )
        self.admin = UserModel.objects.create_user(
            username="cartadmin",
            email="cartadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_cannot_view_cart(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_view_cart(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_add_course_to_cart(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(self.list_url, {"course": self.course.id})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(CartItem.objects.filter(course=self.course).exists())

    def test_admin_cannot_add_course_to_cart(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(self.list_url, {"course": self.course.id})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(CartItem.objects.filter(course=self.course).exists())

    def test_user_sees_only_own_cart_items(self):
        CartItem.objects.create(user=self.student, course=self.course)
        CartItem.objects.create(user=self.other_student, course=self.course)
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["course"]["id"], self.course.id)

    def test_add_course_to_cart(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.list_url, {"course": self.course.id})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["course"]["id"], self.course.id)
        self.assertTrue(
            CartItem.objects.filter(user=self.student, course=self.course).exists()
        )

    def test_add_duplicate_course_is_rejected(self):
        CartItem.objects.create(user=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.list_url, {"course": self.course.id})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            CartItem.objects.filter(user=self.student, course=self.course).count(), 1
        )

    def test_add_unpublished_course_is_rejected(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.list_url, {"course": self.draft_course.id})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_two_users_can_cart_the_same_course_independently(self):
        CartItem.objects.create(user=self.other_student, course=self.course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.list_url, {"course": self.course.id})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class CartItemDetailViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(
            title="Intro to Python",
            code="PY-101",
            category=self.category,
            status=Status.PUBLISHED,
        )
        self.student = UserModel.objects.create_user(
            username="removestudent",
            email="removestudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.other_student = UserModel.objects.create_user(
            username="otherremovestudent",
            email="otherremovestudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="removeteacher",
            email="removeteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )
        self.detail_url = reverse("cart-detail", kwargs={"course_id": self.course.id})

    def test_delete_requires_authentication(self):
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_cannot_remove_from_cart(self):
        CartItem.objects.create(user=self.student, course=self.course)
        self.client.force_authenticate(user=self.teacher)

        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(
            CartItem.objects.filter(user=self.student, course=self.course).exists()
        )

    def test_remove_course_from_cart(self):
        CartItem.objects.create(user=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)

        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            CartItem.objects.filter(user=self.student, course=self.course).exists()
        )

    def test_remove_missing_course_returns_404(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_remove_another_users_cart_item(self):
        CartItem.objects.create(user=self.other_student, course=self.course)
        self.client.force_authenticate(user=self.student)

        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(
            CartItem.objects.filter(user=self.other_student, course=self.course).exists()
        )


class CartCheckoutViewTests(APITestCase):
    def setUp(self):
        self.checkout_url = reverse("cart-checkout")
        self.category = Category.objects.create(name="Programming")

        self.student = UserModel.objects.create_user(
            username="checkoutstudent",
            email="checkoutstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.teacher_a = UserModel.objects.create_user(
            username="checkoutteachera",
            email="checkoutteachera@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )
        self.teacher_b = UserModel.objects.create_user(
            username="checkoutteacherb",
            email="checkoutteacherb@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )

    def test_checkout_requires_authentication(self):
        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_cannot_checkout(self):
        self.client.force_authenticate(user=self.teacher_a)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_checkout_with_empty_cart_returns_400(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_enrolls_student_with_single_instructor(self):
        course = Course.objects.create(
            title="Solo Course", code="SOLO-1", category=self.category, status=Status.PUBLISHED
        )
        CourseInstructor.objects.create(course=course, instructor=self.teacher_a)
        CartItem.objects.create(user=self.student, course=course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["enrolled"]), 1)
        self.assertEqual(data["enrolled"][0]["course_id"], course.id)
        enrollment = Enrollment.objects.get(student=self.student, course=course)
        self.assertEqual(enrollment.teacher_id, self.teacher_a.id)
        self.assertFalse(CartItem.objects.filter(user=self.student, course=course).exists())

    def test_checkout_clears_cart_after_success(self):
        course = Course.objects.create(
            title="Cleared Course", code="CLEAR-1", category=self.category, status=Status.PUBLISHED
        )
        CourseInstructor.objects.create(course=course, instructor=self.teacher_a)
        CartItem.objects.create(user=self.student, course=course)
        self.client.force_authenticate(user=self.student)

        self.client.post(self.checkout_url)

        self.assertEqual(CartItem.objects.filter(user=self.student).count(), 0)

    def test_checkout_picks_least_enrolled_teacher(self):
        course = Course.objects.create(
            title="Shared Course", code="SHARED-1", category=self.category, status=Status.PUBLISHED
        )
        CourseInstructor.objects.create(course=course, instructor=self.teacher_a)
        CourseInstructor.objects.create(course=course, instructor=self.teacher_b)

        # Pre-load teacher_a with 2 students on this course, teacher_b with 0.
        other_student_1 = UserModel.objects.create_user(
            username="other1", email="other1@example.com", password="StrongPass123!",
            role=UserModel.Roles.STUDENT, gender=UserModel.Gender.MALE,
        )
        other_student_2 = UserModel.objects.create_user(
            username="other2", email="other2@example.com", password="StrongPass123!",
            role=UserModel.Roles.STUDENT, gender=UserModel.Gender.MALE,
        )
        Enrollment.objects.create(student=other_student_1, course=course, teacher=self.teacher_a)
        Enrollment.objects.create(student=other_student_2, course=course, teacher=self.teacher_a)

        CartItem.objects.create(user=self.student, course=course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enrollment = Enrollment.objects.get(student=self.student, course=course)
        self.assertEqual(enrollment.teacher_id, self.teacher_b.id)

    def test_checkout_fails_gracefully_when_course_has_no_instructor(self):
        course = Course.objects.create(
            title="Orphan Course", code="ORPHAN-1", category=self.category, status=Status.PUBLISHED
        )
        CartItem.objects.create(user=self.student, course=course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["failed"]), 1)
        self.assertEqual(data["failed"][0]["course_id"], course.id)
        self.assertFalse(Enrollment.objects.filter(student=self.student, course=course).exists())
        # Left in the cart so the student can retry once a teacher is assigned.
        self.assertTrue(CartItem.objects.filter(user=self.student, course=course).exists())

    def test_checkout_treats_already_enrolled_course_as_already_enrolled(self):
        course = Course.objects.create(
            title="Already Enrolled Course",
            code="ALREADY-1",
            category=self.category,
            status=Status.PUBLISHED,
        )
        CourseInstructor.objects.create(course=course, instructor=self.teacher_a)
        Enrollment.objects.create(student=self.student, course=course, teacher=self.teacher_a)
        CartItem.objects.create(user=self.student, course=course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["already_enrolled"]), 1)
        self.assertEqual(Enrollment.objects.filter(student=self.student, course=course).count(), 1)
        self.assertFalse(CartItem.objects.filter(user=self.student, course=course).exists())

    def test_checkout_rejects_course_that_became_unpublished(self):
        course = Course.objects.create(
            title="Unpublished After Add",
            code="UNPUB-1",
            category=self.category,
            status=Status.DRAFT,
        )
        CourseInstructor.objects.create(course=course, instructor=self.teacher_a)
        CartItem.objects.create(user=self.student, course=course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["failed"]), 1)
        self.assertFalse(Enrollment.objects.filter(student=self.student, course=course).exists())

    def test_checkout_processes_multiple_courses_independently(self):
        good_course = Course.objects.create(
            title="Good Course", code="GOOD-1", category=self.category, status=Status.PUBLISHED
        )
        CourseInstructor.objects.create(course=good_course, instructor=self.teacher_a)
        orphan_course = Course.objects.create(
            title="No Teacher Course",
            code="NOTEACH-1",
            category=self.category,
            status=Status.PUBLISHED,
        )
        CartItem.objects.create(user=self.student, course=good_course)
        CartItem.objects.create(user=self.student, course=orphan_course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["enrolled"]), 1)
        self.assertEqual(len(data["failed"]), 1)
        self.assertTrue(
            Enrollment.objects.filter(student=self.student, course=good_course).exists()
        )
        self.assertTrue(CartItem.objects.filter(user=self.student, course=orphan_course).exists())
