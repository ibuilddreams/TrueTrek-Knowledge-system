from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment
from progress.models import CourseProgress

UserModel = get_user_model()

LOGIN_URL = "/api/auth/login/"


class CustomTokenObtainPairViewTests(APITestCase):
    def setUp(self):
        self.user = UserModel.objects.create_user(
            username="loginviewuser",
            email="loginviewuser@example.com",
            password="StrongPass123!",
        )

    def test_login_success_returns_200_and_tokens(self):
        response = self.client.post(
            LOGIN_URL,
            {"email": "loginviewuser@example.com", "password": "StrongPass123!"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"] if "success" in response.data else True)
        self.assertIn("data", response.data)
        self.assertIn("access_token", response.data["data"])
        self.assertIn("refresh_token", response.data["data"])

    def test_login_invalid_credentials_returns_error_shape(self):
        response = self.client.post(
            LOGIN_URL,
            {"email": "loginviewuser@example.com", "password": "WrongPassword!"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", response.data)

    def test_login_inactive_user_returns_error(self):
        self.user.is_active = False
        self.user.save()

        response = self.client.post(
            LOGIN_URL,
            {"email": "loginviewuser@example.com", "password": "StrongPass123!"},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("message", response.data)


class StudentListCreateViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("student-list-create")

        self.admin = UserModel.objects.create_user(
            username="adminuser",
            email="adminuser@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
        )

        self.student = UserModel.objects.create_user(
            username="existingstudent",
            email="existingstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
        )

        self.teacher = UserModel.objects.create_user(
            username="existingteacher",
            email="existingteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
        )

    def _valid_student_payload(self, **overrides):
        payload = {
            "username": "brandnewstudent",
            "first_name": "Brand",
            "last_name": "New",
            "email": "brandnewstudent@example.com",
            "password": "StrongPass123!",
            "gender": UserModel.Gender.MALE,
        }
        payload.update(overrides)
        return payload

    def test_list_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_students(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_usernames = [item["username"] for item in response.data["data"]["users"]]

        self.assertIn("existingstudent", returned_usernames)
        self.assertNotIn("existingteacher", returned_usernames)
        self.assertNotIn("adminuser", returned_usernames)

    def test_list_response_is_paginated_with_users_key(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertIn("users", response.data["data"])
        self.assertNotIn("results", response.data["data"])

    def test_create_requires_authentication(self):
        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_valid_data_returns_201(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            UserModel.objects.filter(username="brandnewstudent", role=UserModel.Roles.STUDENT).exists()
        )

    def test_create_invalid_data_returns_400(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self._valid_student_payload(email="existingstudent@example.com"),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_forbidden_for_teacher(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(UserModel.objects.filter(username="brandnewstudent").exists())

    def test_create_forbidden_for_student(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url, self._valid_student_payload())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(UserModel.objects.filter(username="brandnewstudent").exists())


class TeacherListCreateViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("teacher-list-create")

        self.admin = UserModel.objects.create_user(
            username="adminuser",
            email="adminuser@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.ADMIN,
        )

        self.student = UserModel.objects.create_user(
            username="existingstudent",
            email="existingstudent@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.FEMALE,
            role=UserModel.Roles.STUDENT,
        )

        self.teacher = UserModel.objects.create_user(
            username="existingteacher",
            email="existingteacher@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
        )

    def _valid_teacher_payload(self, **overrides):
        payload = {
            "username": "brandnewteacher",
            "first_name": "Brand",
            "last_name": "New",
            "email": "brandnewteacher@example.com",
            "password": "StrongPass123!",
            "gender": UserModel.Gender.MALE,
        }
        payload.update(overrides)
        return payload

    def test_list_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_teachers(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_usernames = [item["username"] for item in response.data["data"]["users"]]

        self.assertIn("existingteacher", returned_usernames)
        self.assertNotIn("existingstudent", returned_usernames)
        self.assertNotIn("adminuser", returned_usernames)

    def test_list_response_is_paginated_with_users_key(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertIn("users", response.data["data"])
        self.assertNotIn("results", response.data["data"])

    def test_create_requires_authentication(self):
        response = self.client.post(self.url, self._valid_teacher_payload())

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_valid_data_returns_201(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(self.url, self._valid_teacher_payload())

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            UserModel.objects.filter(username="brandnewteacher", role=UserModel.Roles.TEACHER).exists()
        )

    def test_create_invalid_data_returns_400(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self.url,
            self._valid_teacher_payload(email="existingteacher@example.com"),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_forbidden_for_teacher(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(self.url, self._valid_teacher_payload())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(UserModel.objects.filter(username="brandnewteacher").exists())

    def test_create_forbidden_for_student(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url, self._valid_teacher_payload())

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(UserModel.objects.filter(username="brandnewteacher").exists())


class TeacherDetailViewTests(APITestCase):
    def setUp(self):
        self.admin = UserModel.objects.create_user(
            username="adminuser",
            email="adminuser@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.ADMIN,
        )

        self.teacher = UserModel.objects.create_user(
            username="detailteacher",
            email="detailteacher@example.com",
            password="StrongPass123!",
            first_name="Detail",
            last_name="Teacher",
            gender=UserModel.Gender.FEMALE,
            role=UserModel.Roles.TEACHER,
        )

        self.student = UserModel.objects.create_user(
            username="detailstudent",
            email="detailstudent@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.OTHER,
            role=UserModel.Roles.STUDENT,
        )

        self.url = reverse("teacher-detail", kwargs={"pk": self.teacher.pk})

    def test_retrieve_requires_admin(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_returns_teacher(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["username"], "detailteacher")
        self.assertEqual(response.data["data"]["role"], UserModel.Roles.TEACHER)

    def test_update_teacher(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            self.url,
            {
                "first_name": "Updated",
                "last_name": "Name",
                "gender": UserModel.Gender.MALE,
                "account_status": UserModel.AccountStatus.SUSPENDED,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.first_name, "Updated")
        self.assertEqual(self.teacher.account_status, UserModel.AccountStatus.SUSPENDED)

    def test_destroy_deactivates_teacher(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.account_status, UserModel.AccountStatus.DEACTIVATED)
        self.assertFalse(self.teacher.is_active)
        self.assertTrue(UserModel.objects.filter(pk=self.teacher.pk).exists())


class TeacherSelfServiceViewsTests(APITestCase):
    def setUp(self):
        self.teacher = UserModel.objects.create_user(
            username="selfteacher",
            email="selfteacher@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
        )

        self.other_teacher = UserModel.objects.create_user(
            username="otherteacher",
            email="otherteacher@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
        )

        self.student_one = UserModel.objects.create_user(
            username="enrolledstudentone",
            email="enrolledstudentone@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.FEMALE,
            role=UserModel.Roles.STUDENT,
        )

        self.student_two = UserModel.objects.create_user(
            username="enrolledstudenttwo",
            email="enrolledstudenttwo@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.FEMALE,
            role=UserModel.Roles.STUDENT,
        )

        self.unrelated_student = UserModel.objects.create_user(
            username="unrelatedstudent",
            email="unrelatedstudent@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.OTHER,
            role=UserModel.Roles.STUDENT,
        )

        self.category = Category.objects.create(name="Compliance")

        self.assigned_course = Course.objects.create(
            title="Assigned Course",
            category=self.category,
        )
        CourseInstructor.objects.create(course=self.assigned_course, instructor=self.teacher)

        self.other_course = Course.objects.create(
            title="Other Teacher's Course",
            category=self.category,
        )
        CourseInstructor.objects.create(course=self.other_course, instructor=self.other_teacher)

        Enrollment.objects.create(student=self.student_one, course=self.assigned_course)
        Enrollment.objects.create(student=self.student_two, course=self.assigned_course)
        Enrollment.objects.create(student=self.unrelated_student, course=self.other_course)

        CourseProgress.objects.create(
            student=self.student_one,
            course=self.assigned_course,
            completion_percentage=50,
        )

    def test_assigned_courses_requires_teacher(self):
        self.client.force_authenticate(user=self.student_one)

        response = self.client.get(reverse("teacher-assigned-courses-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_assigned_courses_returns_only_own_courses_with_student_count(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(reverse("teacher-assigned-courses-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["total_courses"], 1)
        self.assertEqual(data["courses"][0]["id"], self.assigned_course.id)
        self.assertEqual(data["courses"][0]["total_students"], 2)

    def test_assigned_courses_with_students_returns_enrolled_students(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(reverse("teacher-assigned-courses-students-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["total_courses"], 1)
        course_data = data["courses"][0]
        self.assertEqual(course_data["id"], self.assigned_course.id)
        self.assertEqual(course_data["total_students"], 2)
        returned_student_ids = [entry["student"]["id"] for entry in course_data["students"]]
        self.assertIn(self.student_one.id, returned_student_ids)
        self.assertIn(self.student_two.id, returned_student_ids)

    def test_enrolled_students_roster_returns_only_teacher_students(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(reverse("teacher-enrolled-students-roster"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["total_students"], 2)
        returned_ids = {entry["id"] for entry in data["students"]}
        self.assertEqual(returned_ids, {self.student_one.id, self.student_two.id})
        student_one = next(entry for entry in data["students"] if entry["id"] == self.student_one.id)
        self.assertEqual(student_one["average_progress"], 50.0)
        self.assertEqual(student_one["courses_count"], 1)

    def test_enrolled_student_detail_returns_student_scoped_to_teacher_courses(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(
            reverse("teacher-enrolled-student-detail", kwargs={"student_id": self.student_one.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["student"]["id"], self.student_one.id)
        self.assertEqual(data["total_courses"], 1)
        self.assertEqual(data["courses"][0]["course"]["id"], self.assigned_course.id)
        self.assertEqual(data["courses"][0]["completion_percentage"], Decimal("50.00"))

    def test_enrolled_student_detail_returns_404_for_unrelated_student(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(
            reverse("teacher-enrolled-student-detail", kwargs={"student_id": self.unrelated_student.id})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
