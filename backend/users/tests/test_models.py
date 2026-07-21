from django.contrib.auth import get_user_model
from django.test import TestCase

UserModel = get_user_model()


class CustomUserManagerTests(TestCase):
    def test_create_user_success(self):
        user = UserModel.objects.create_user(
            username="johndoe",
            email="John.Doe@Example.com",
            password="StrongPass123!",
            first_name="John",
            last_name="Doe",
        )

        self.assertEqual(user.email, "John.Doe@example.com")
        self.assertNotEqual(user.password, "StrongPass123!")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_create_user_without_email_raises_error(self):
        with self.assertRaises(ValueError):
            UserModel.objects.create_user(
                username="noemail",
                email=None,
                password="StrongPass123!",
            )

    def test_create_superuser_success(self):
        user = UserModel.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="StrongPass123!",
        )

        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertEqual(user.role, UserModel.Roles.ADMIN)

    def test_create_superuser_with_is_staff_false_raises_error(self):
        with self.assertRaises(ValueError):
            UserModel.objects.create_superuser(
                username="admin2",
                email="admin2@example.com",
                password="StrongPass123!",
                is_staff=False,
            )

    def test_create_superuser_with_is_superuser_false_raises_error(self):
        with self.assertRaises(ValueError):
            UserModel.objects.create_superuser(
                username="admin3",
                email="admin3@example.com",
                password="StrongPass123!",
                is_superuser=False,
            )


class CustomUserModelTests(TestCase):
    def test_save_auto_populates_name(self):
        user = UserModel.objects.create_user(
            username="janedoe",
            email="jane@example.com",
            password="StrongPass123!",
            first_name="Jane",
            last_name="Doe",
        )

        self.assertEqual(user.name, "Jane Doe")

    def test_save_does_not_override_existing_name(self):
        user = UserModel.objects.create_user(
            username="janedoe2",
            email="jane2@example.com",
            password="StrongPass123!",
            first_name="Jane",
            last_name="Doe",
            name="Custom Name",
        )

        self.assertEqual(user.name, "Custom Name")

    def test_str_representation(self):
        user = UserModel.objects.create_user(
            username="strtest",
            email="strtest@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
        )

        self.assertEqual(str(user), "strtest (TEACHER)")

    def test_is_admin_property(self):
        user = UserModel.objects.create_user(
            username="adminrole",
            email="adminrole@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
        )

        self.assertTrue(user.is_admin)
        self.assertFalse(user.is_teacher)
        self.assertFalse(user.is_student)

    def test_is_teacher_property(self):
        user = UserModel.objects.create_user(
            username="teacherrole",
            email="teacherrole@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
        )

        self.assertTrue(user.is_teacher)
        self.assertFalse(user.is_admin)
        self.assertFalse(user.is_student)

    def test_is_student_property(self):
        user = UserModel.objects.create_user(
            username="studentrole",
            email="studentrole@example.com",
            password="StrongPass123!",
        )

        self.assertTrue(user.is_student)
        self.assertFalse(user.is_admin)
        self.assertFalse(user.is_teacher)
