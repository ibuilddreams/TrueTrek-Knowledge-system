import csv
import io
from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from users.models import UserProfile

UserModel = get_user_model()


def read_csv(response):
    content = b"".join(response.streaming_content).decode("utf-8").lstrip("\ufeff")
    rows = list(csv.reader(io.StringIO(content)))
    return rows[0], rows[1:]


class UserAdminExportTests(TestCase):
    """The CSV export button and action on Admin -> Users."""

    def setUp(self):
        self.superuser = UserModel.objects.create_user(
            username="exportadmin",
            email="exportadmin@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.OTHER,
            role=UserModel.Roles.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.client.force_login(self.superuser)

        self.student = UserModel.objects.create_user(
            username="riley",
            email="riley@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.FEMALE,
            role=UserModel.Roles.STUDENT,
            first_name="Riley",
            last_name="Cruz",
            is_verified=True,
        )
        UserProfile.objects.create(
            user=self.student,
            phone_number="+1 555 0100",
            date_of_birth=date(2008, 4, 17),
            city="Austin",
            country="USA",
            website="https://riley.example.com",
            bio="Point guard.",
        )

        # Deliberately left without a profile row: accounts predating the model
        # have none, and an export must not fall over on them.
        self.teacher = UserModel.objects.create_user(
            username="morgan",
            email="morgan@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
            first_name="Morgan",
            last_name="Hale",
        )

        self.export_url = reverse("admin:users_customuser_export_csv")
        self.changelist_url = reverse("admin:users_customuser_changelist")

    def object_export_url(self, user):
        return reverse("admin:users_customuser_export_object_csv", args=[user.pk])

    # -- one user at a time ------------------------------------------------

    def test_every_row_carries_its_own_export_link(self):
        response = self.client.get(self.changelist_url)

        self.assertContains(response, self.object_export_url(self.student))
        self.assertContains(response, self.object_export_url(self.teacher))

    def test_the_user_page_offers_an_export_button(self):
        response = self.client.get(
            reverse("admin:users_customuser_change", args=[self.student.pk])
        )

        self.assertContains(response, self.object_export_url(self.student))
        self.assertContains(response, "Export CSV")

    def test_exporting_one_user_returns_that_user_and_the_header(self):
        response = self.client.get(self.object_export_url(self.student))

        self.assertEqual(response.status_code, 200)
        header, rows = read_csv(response)
        self.assertEqual(len(rows), 1)
        row = dict(zip(header, rows[0]))
        self.assertEqual(row["Username"], "riley")
        self.assertEqual(row["Email"], "riley@example.com")
        self.assertEqual(row["City"], "Austin")

    def test_one_user_exports_the_same_columns_as_the_whole_list(self):
        one, _rows = read_csv(self.client.get(self.object_export_url(self.teacher)))
        everyone, _rows = read_csv(self.client.get(self.export_url))

        self.assertEqual(one, everyone)

    def test_a_single_export_is_filed_under_the_user_it_holds(self):
        response = self.client.get(self.object_export_url(self.student))

        # The username alone, not str(user)'s "riley (STUDENT)".
        self.assertIn('filename="users-riley-', response["Content-Disposition"])

    def test_one_user_export_never_carries_the_password(self):
        response = self.client.get(self.object_export_url(self.student))

        header, rows = read_csv(response)
        self.assertNotIn("Password", header)
        self.assertNotIn(self.student.password, " ".join(rows[0]))

    # -- the list, filtered or whole ---------------------------------------

    def test_changelist_offers_the_export_button(self):
        response = self.client.get(self.changelist_url)

        self.assertContains(response, self.export_url)
        self.assertContains(response, "Export CSV")

    def test_export_returns_the_account_and_its_profile(self):
        response = self.client.get(f"{self.export_url}?q=riley")

        self.assertEqual(response.status_code, 200)
        self.assertIn('attachment; filename="users-', response["Content-Disposition"])

        header, rows = read_csv(response)
        self.assertEqual(len(rows), 1)
        row = dict(zip(header, rows[0]))
        self.assertEqual(row["Username"], "riley")
        self.assertEqual(row["Email"], "riley@example.com")
        self.assertEqual(row["Full name"], "Riley Cruz")
        self.assertEqual(row["Role"], "Student")
        self.assertEqual(row["Gender"], "Female")
        self.assertEqual(row["Account status"], "Active")
        self.assertEqual(row["Verified"], "Yes")
        self.assertEqual(row["Superuser"], "No")
        self.assertEqual(row["Phone number"], "+1 555 0100")
        self.assertEqual(row["Date of birth"], "2008-04-17")
        self.assertEqual(row["City"], "Austin")
        self.assertEqual(row["Country"], "USA")
        self.assertEqual(row["Bio"], "Point guard.")

    def test_an_account_without_a_profile_exports_blank_profile_columns(self):
        response = self.client.get(f"{self.export_url}?q=morgan")

        header, rows = read_csv(response)
        row = dict(zip(header, rows[0]))
        self.assertEqual(row["Username"], "morgan")
        self.assertEqual(row["Phone number"], "")
        self.assertEqual(row["City"], "")
        self.assertEqual(row["Date of birth"], "")

    def test_export_never_carries_the_password(self):
        response = self.client.get(self.export_url)

        header, rows = read_csv(response)
        self.assertNotIn("Password", header)
        joined = " ".join(cell for row in rows for cell in row)
        self.assertNotIn(self.student.password, joined)
        self.assertNotIn("pbkdf2", joined)

    def test_export_follows_the_changelist_filter(self):
        response = self.client.get(f"{self.export_url}?role__exact={UserModel.Roles.TEACHER}")

        header, rows = read_csv(response)
        username = header.index("Username")
        self.assertEqual([row[username] for row in rows], ["morgan"])

    def test_action_exports_only_the_selected_rows(self):
        response = self.client.post(
            self.changelist_url,
            {
                "action": "export_selected_csv",
                "_selected_action": [str(self.student.pk)],
            },
        )

        header, rows = read_csv(response)
        username = header.index("Username")
        self.assertEqual([row[username] for row in rows], ["riley"])

    def test_export_is_refused_to_a_staff_user_without_view_permission(self):
        staff = UserModel.objects.create_user(
            username="plainstaff",
            email="plainstaff@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
            is_staff=True,
        )
        self.client.force_login(staff)

        response = self.client.get(self.export_url)

        self.assertEqual(response.status_code, 403)
