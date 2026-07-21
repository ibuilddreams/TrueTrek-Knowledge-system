from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase

from users.permissions import IsAdmin, IsStudent, IsTeacher

UserModel = get_user_model()


class RolePermissionTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.admin = UserModel.objects.create_user(
            username="admin1", email="admin1@example.com", password="StrongPass123!", role=UserModel.Roles.ADMIN
        )
        self.teacher = UserModel.objects.create_user(
            username="teacher1", email="teacher1@example.com", password="StrongPass123!", role=UserModel.Roles.TEACHER
        )
        self.student = UserModel.objects.create_user(
            username="student1", email="student1@example.com", password="StrongPass123!", role=UserModel.Roles.STUDENT
        )
        self.request = self.factory.get("/")

    def test_is_admin_permission(self):
        self.request.user = self.admin
        self.assertTrue(IsAdmin().has_permission(self.request, None))

        self.request.user = self.teacher
        self.assertFalse(IsAdmin().has_permission(self.request, None))

    def test_is_teacher_permission(self):
        self.request.user = self.teacher
        self.assertTrue(IsTeacher().has_permission(self.request, None))

        self.request.user = self.student
        self.assertFalse(IsTeacher().has_permission(self.request, None))

    def test_is_student_permission(self):
        self.request.user = self.student
        self.assertTrue(IsStudent().has_permission(self.request, None))

        self.request.user = self.admin
        self.assertFalse(IsStudent().has_permission(self.request, None))

    def test_unauthenticated_user_denied(self):
        self.request.user = None
        self.assertFalse(IsAdmin().has_permission(self.request, None))
        self.assertFalse(IsTeacher().has_permission(self.request, None))
        self.assertFalse(IsStudent().has_permission(self.request, None))
