import csv
import io

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from common.admin_export import reads_as_a_formula
from common.models import Status
from courses.admin import CourseAdmin
from courses.models import Category, Course, CourseInstructor, Tag
from modules.models import Module

UserModel = get_user_model()


def read_csv(response):
    """Drain a streamed export into (header, rows), BOM and all."""
    content = b"".join(response.streaming_content).decode("utf-8")
    assert content.startswith("\ufeff"), "export is missing the Excel byte-order mark"
    reader = csv.reader(io.StringIO(content.lstrip("\ufeff")))
    rows = list(reader)
    return rows[0], rows[1:]


class CourseAdminExportTests(TestCase):
    """The CSV export button and action on Admin -> Courses.

    Most of what is asserted here belongs to `common.admin_export.ExportCsvMixin`
    rather than to courses specifically, so this is where the shared behaviour —
    filters, permissions, the formula guard — is pinned.
    """

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

        self.category = Category.objects.create(name="Mindset")
        self.tag = Tag.objects.create(name="Leadership")

        self.teacher = UserModel.objects.create_user(
            username="exportteacher",
            email="exportteacher@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.FEMALE,
            role=UserModel.Roles.TEACHER,
            first_name="Dana",
            last_name="Reed",
        )

        self.published = Course.objects.create(
            title="Mental Toughness",
            code="MT-101",
            category=self.category,
            status=Status.PUBLISHED,
            amount="49.99",
            duration_minutes=90,
            grade_min=9,
            grade_max=12,
            learning_outcomes=["Hold a routine", "Reset after a mistake"],
        )
        self.published.tags.add(self.tag)
        CourseInstructor.objects.create(
            course=self.published, instructor=self.teacher, is_lead=True
        )
        Module.objects.create(course=self.published, title="Foundations", order=1)
        Module.objects.create(course=self.published, title="Applied Practice", order=2)

        self.draft = Course.objects.create(
            title="Recruiting Basics",
            code="REC-101",
            category=self.category,
            status=Status.DRAFT,
        )

        self.export_url = reverse("admin:courses_course_export_csv")
        self.changelist_url = reverse("admin:courses_course_changelist")

    def object_export_url(self, course):
        return reverse("admin:courses_course_export_object_csv", args=[course.pk])

    # -- one course at a time ----------------------------------------------

    def test_every_row_carries_its_own_export_link(self):
        response = self.client.get(self.changelist_url)

        self.assertContains(response, self.object_export_url(self.published))
        self.assertContains(response, self.object_export_url(self.draft))

    def test_the_course_page_offers_an_export_button(self):
        response = self.client.get(
            reverse("admin:courses_course_change", args=[self.published.pk])
        )

        self.assertContains(response, self.object_export_url(self.published))
        self.assertContains(response, "Export CSV")

    def test_exporting_one_course_returns_that_course_and_the_header(self):
        response = self.client.get(self.object_export_url(self.published))

        self.assertEqual(response.status_code, 200)
        header, rows = read_csv(response)
        self.assertEqual(len(rows), 1)
        row = dict(zip(header, rows[0]))
        self.assertEqual(row["Code"], "MT-101")
        self.assertEqual(row["Title"], "Mental Toughness")
        self.assertEqual(row["Tags"], "Leadership")
        self.assertEqual(row["Modules"], "2")

    def test_one_course_exports_the_same_columns_as_the_whole_catalog(self):
        one, _rows = read_csv(self.client.get(self.object_export_url(self.draft)))
        all_of_them, _rows = read_csv(self.client.get(self.export_url))

        self.assertEqual(one, all_of_them)

    def test_a_single_export_is_filed_under_the_course_it_holds(self):
        response = self.client.get(self.object_export_url(self.published))

        self.assertIn(
            'filename="courses-mt-101-mental-toughness-',
            response["Content-Disposition"],
        )

    def test_exporting_a_course_that_is_gone_is_a_404(self):
        missing = self.draft.pk
        self.draft.delete()

        response = self.client.get(
            reverse("admin:courses_course_export_object_csv", args=[missing])
        )

        self.assertEqual(response.status_code, 404)

    def test_one_course_export_is_refused_without_view_permission(self):
        staff = UserModel.objects.create_user(
            username="rowstaff",
            email="rowstaff@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
            is_staff=True,
        )
        self.client.force_login(staff)

        response = self.client.get(self.object_export_url(self.published))

        self.assertEqual(response.status_code, 403)

    # -- the list, filtered or whole ---------------------------------------

    def test_changelist_offers_the_export_button(self):
        response = self.client.get(self.changelist_url)

        self.assertContains(response, self.export_url)
        self.assertContains(response, "Export CSV")

    def test_export_button_carries_the_current_filters(self):
        response = self.client.get(f"{self.changelist_url}?status__exact=PUBLISHED")

        self.assertContains(response, f"{self.export_url}?status__exact=PUBLISHED")

    def test_export_returns_every_row_with_the_configured_columns(self):
        response = self.client.get(self.export_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv; charset=utf-8")
        self.assertIn("attachment; filename=\"courses-", response["Content-Disposition"])

        header, rows = read_csv(response)
        self.assertEqual(header[:4], ["ID", "Code", "Title", "Slug"])
        self.assertEqual(len(rows), 2)

        row = dict(zip(header, next(r for r in rows if r[1] == "MT-101")))
        self.assertEqual(row["Title"], "Mental Toughness")
        self.assertEqual(row["Category"], "Mindset")
        self.assertEqual(row["Status"], "Published")
        self.assertEqual(row["Difficulty"], "Beginner")
        self.assertEqual(row["Tags"], "Leadership")
        self.assertEqual(row["Instructors"], "Dana Reed")
        self.assertEqual(row["Price"], "49.99")
        self.assertEqual(row["Duration (minutes)"], "90")
        self.assertEqual(row["Grade label"], "Grades 9–12")
        self.assertEqual(row["Modules"], "2")
        self.assertEqual(row["Enrollments"], "0")
        self.assertEqual(row["Learning outcomes"], "Hold a routine | Reset after a mistake")

    def test_export_follows_the_changelist_filter(self):
        response = self.client.get(f"{self.export_url}?status__exact={Status.PUBLISHED}")

        _header, rows = read_csv(response)
        self.assertEqual([row[1] for row in rows], ["MT-101"])

    def test_export_follows_the_changelist_search(self):
        response = self.client.get(f"{self.export_url}?q=Recruiting")

        _header, rows = read_csv(response)
        self.assertEqual([row[1] for row in rows], ["REC-101"])

    def test_export_covers_more_than_the_page_on_screen(self):
        for index in range(CourseAdmin.list_per_page + 5):
            Course.objects.create(
                title=f"Filler {index}", code=f"FILL-{index}", category=self.category
            )

        response = self.client.get(self.export_url)

        _header, rows = read_csv(response)
        self.assertEqual(len(rows), Course.objects.count())

    def test_action_exports_only_the_selected_rows(self):
        response = self.client.post(
            self.changelist_url,
            {
                "action": "export_selected_csv",
                "_selected_action": [str(self.draft.pk)],
            },
        )

        _header, rows = read_csv(response)
        self.assertEqual([row[1] for row in rows], ["REC-101"])

    def test_text_a_spreadsheet_would_run_is_quoted_out(self):
        Course.objects.create(
            title="=HYPERLINK(\"http://evil.test\")",
            code="EVIL-1",
            category=self.category,
            grade_min=-1,
            grade_max=0,
        )

        response = self.client.get(f"{self.export_url}?q=HYPERLINK")

        header, rows = read_csv(response)
        row = dict(zip(header, rows[0]))
        self.assertEqual(row["Title"], "'=HYPERLINK(\"http://evil.test\")")
        # A negative number is not a formula, and must survive untouched.
        self.assertEqual(row["Grade min"], "-1")

    def test_the_formula_guard_leaves_signed_numbers_alone(self):
        self.assertFalse(reads_as_a_formula("+1 555 0100"))
        self.assertFalse(reads_as_a_formula("+1 (555) 010-0100"))
        self.assertFalse(reads_as_a_formula("-12.5"))
        self.assertTrue(reads_as_a_formula("+cmd|'/c calc'!A0"))
        self.assertTrue(reads_as_a_formula("-2+SUM(A1:A2)"))
        self.assertTrue(reads_as_a_formula("@SUM(A1)"))
        self.assertTrue(reads_as_a_formula("\tnot a tab stop"))

    def test_unreadable_filters_send_the_admin_back_rather_than_a_broken_file(self):
        response = self.client.get(f"{self.export_url}?category__id__exact=not-a-number")

        self.assertRedirects(response, self.changelist_url)

    def test_export_is_refused_to_a_staff_user_without_view_permission(self):
        staff = UserModel.objects.create_user(
            username="exportstaff",
            email="exportstaff@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.TEACHER,
            is_staff=True,
        )
        self.client.force_login(staff)

        response = self.client.get(self.export_url)

        self.assertEqual(response.status_code, 403)

    def test_export_is_refused_to_a_user_who_is_not_staff(self):
        student = UserModel.objects.create_user(
            username="exportstudent",
            email="exportstudent@example.com",
            password="StrongPass123!",
            gender=UserModel.Gender.MALE,
            role=UserModel.Roles.STUDENT,
        )
        self.client.force_login(student)

        response = self.client.get(self.export_url)

        self.assertEqual(response.status_code, 302)
        self.assertIn("login", response["Location"])
