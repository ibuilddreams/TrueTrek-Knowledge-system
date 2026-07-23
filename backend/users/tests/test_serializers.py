from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import PermissionDenied, ValidationError

from users.serializers import (
    CreateStudentSerializer,
    CreateTeacherSerializer,
    CustomTokenObtainPairSerializer,
    StudentSerializer,
    TeacherSerializer,
)

UserModel = get_user_model()


class CreateStudentSerializerTests(TestCase):
    def _valid_payload(self, **overrides):
        payload = {
            "username": "newstudent",
            "first_name": "New",
            "last_name": "Student",
            "email": "newstudent@example.com",
            "password": "StrongPass123!",
            "gender": UserModel.Gender.MALE,
        }
        payload.update(overrides)
        return payload

    def test_valid_data_creates_student(self):
        serializer = CreateStudentSerializer(data=self._valid_payload())

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()

        self.assertEqual(user.role, UserModel.Roles.STUDENT)

    def test_password_is_hashed_not_plaintext(self):
        serializer = CreateStudentSerializer(data=self._valid_payload())
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        self.assertNotEqual(user.password, "StrongPass123!")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_duplicate_email_rejected(self):
        UserModel.objects.create_user(
            username="existing",
            email="dup@example.com",
            password="StrongPass123!",
        )

        serializer = CreateStudentSerializer(
            data=self._valid_payload(username="anotherusername", email="dup@example.com")
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_duplicate_username_rejected(self):
        UserModel.objects.create_user(
            username="dupusername",
            email="unique@example.com",
            password="StrongPass123!",
        )

        serializer = CreateStudentSerializer(
            data=self._valid_payload(username="dupusername", email="another@example.com")
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_weak_password_rejected(self):
        serializer = CreateStudentSerializer(data=self._valid_payload(password="password"))

        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_to_representation_shape(self):
        serializer = CreateStudentSerializer(data=self._valid_payload())
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        representation = serializer.to_representation(user)

        self.assertEqual(
            set(representation.keys()),
            {"id", "username", "first_name", "last_name", "full_name", "email", "gender", "role"},
        )


class CustomTokenObtainPairSerializerTests(TestCase):
    def setUp(self):
        self.user = UserModel.objects.create_user(
            username="loginuser",
            email="loginuser@example.com",
            password="StrongPass123!",
        )

    def test_valid_credentials_returns_tokens(self):
        serializer = CustomTokenObtainPairSerializer(
            data={"email": "loginuser@example.com", "password": "StrongPass123!"}
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIn("access", serializer.validated_data)
        self.assertIn("refresh", serializer.validated_data)

    def test_invalid_password_raises_validation_error(self):
        serializer = CustomTokenObtainPairSerializer(
            data={"email": "loginuser@example.com", "password": "WrongPassword!"}
        )

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_nonexistent_email_raises_validation_error(self):
        serializer = CustomTokenObtainPairSerializer(
            data={"email": "doesnotexist@example.com", "password": "StrongPass123!"}
        )

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_inactive_user_raises_permission_denied(self):
        self.user.is_active = False
        self.user.save()

        serializer = CustomTokenObtainPairSerializer(
            data={"email": "loginuser@example.com", "password": "StrongPass123!"}
        )

        with self.assertRaises(PermissionDenied):
            serializer.is_valid(raise_exception=True)

    def test_to_representation_shape(self):
        serializer = CustomTokenObtainPairSerializer(
            data={"email": "loginuser@example.com", "password": "StrongPass123!"}
        )
        serializer.is_valid(raise_exception=True)

        representation = serializer.to_representation(serializer.validated_data)

        self.assertIn("access_token", representation)
        self.assertIn("refresh_token", representation)
        self.assertEqual(
            set(representation["user"].keys()),
            {"id", "first_name", "last_name", "full_name", "email", "role"},
        )


class StudentSerializerTests(TestCase):
    def setUp(self):
        self.user = UserModel.objects.create_user(
            username="readonlystudent",
            email="readonlystudent@example.com",
            password="StrongPass123!",
            first_name="Read",
            last_name="Only",
        )

    def test_all_fields_read_only(self):
        serializer = StudentSerializer(
            instance=self.user,
            data={"username": "changed", "email": "changed@example.com"},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_user = serializer.save()

        self.assertEqual(updated_user.username, "readonlystudent")
        self.assertEqual(updated_user.email, "readonlystudent@example.com")

    def test_full_name_sources_from_name(self):
        serializer = StudentSerializer(instance=self.user)

        self.assertEqual(serializer.data["full_name"], self.user.name)


class CreateTeacherSerializerTests(TestCase):
    def _valid_payload(self, **overrides):
        payload = {
            "username": "newteacher",
            "first_name": "New",
            "last_name": "Teacher",
            "email": "newteacher@example.com",
            "password": "StrongPass123!",
            "gender": UserModel.Gender.MALE,
        }
        payload.update(overrides)
        return payload

    def test_valid_data_creates_teacher(self):
        serializer = CreateTeacherSerializer(data=self._valid_payload())

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()

        self.assertEqual(user.role, UserModel.Roles.TEACHER)

    def test_password_is_hashed_not_plaintext(self):
        serializer = CreateTeacherSerializer(data=self._valid_payload())
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        self.assertNotEqual(user.password, "StrongPass123!")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_duplicate_email_rejected(self):
        UserModel.objects.create_user(
            username="existing",
            email="dup@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )

        serializer = CreateTeacherSerializer(
            data=self._valid_payload(username="anotherusername", email="dup@example.com")
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_duplicate_username_rejected(self):
        UserModel.objects.create_user(
            username="dupusername",
            email="unique@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
        )

        serializer = CreateTeacherSerializer(
            data=self._valid_payload(username="dupusername", email="another@example.com")
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_weak_password_rejected(self):
        serializer = CreateTeacherSerializer(data=self._valid_payload(password="password"))

        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_to_representation_shape(self):
        serializer = CreateTeacherSerializer(data=self._valid_payload())
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        representation = serializer.to_representation(user)

        self.assertEqual(
            set(representation.keys()),
            {"id", "username", "first_name", "last_name", "full_name", "email", "gender", "role"},
        )


class TeacherSerializerTests(TestCase):
    def setUp(self):
        self.user = UserModel.objects.create_user(
            username="readonlyteacher",
            email="readonlyteacher@example.com",
            password="StrongPass123!",
            first_name="Read",
            last_name="Only",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
        )

    def test_all_fields_read_only(self):
        serializer = TeacherSerializer(
            instance=self.user,
            data={"username": "changed", "email": "changed@example.com"},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_user = serializer.save()

        self.assertEqual(updated_user.username, "readonlyteacher")
        self.assertEqual(updated_user.email, "readonlyteacher@example.com")

    def test_full_name_sources_from_name(self):
        serializer = TeacherSerializer(instance=self.user)

        self.assertEqual(serializer.data["full_name"], self.user.name)
