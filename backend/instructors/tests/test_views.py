import io
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from ..models import InstructorFeedback

UserModel = get_user_model()


def make_user(username, role, **extra):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
        **extra,
    )


class InstructorTestCase(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Programming")
        self.teacher = make_user("teach", UserModel.Roles.TEACHER, first_name="Ryan", last_name="Ahmed")
        self.idle_teacher = make_user("idle", UserModel.Roles.TEACHER)
        self.student = make_user("stud", UserModel.Roles.STUDENT, first_name="Dot", last_name="Brown")
        self.outsider = make_user("outsider", UserModel.Roles.STUDENT)

        self.course = Course.objects.create(
            title="Claude Masterclass", code="CM1", category=category, status=Status.PUBLISHED
        )
        self.draft = Course.objects.create(
            title="Draft Only", code="DR1", category=category, status=Status.DRAFT
        )
        CourseInstructor.objects.create(course=self.course, instructor=self.teacher, is_lead=True)
        CourseInstructor.objects.create(course=self.draft, instructor=self.idle_teacher, is_lead=True)
        Enrollment.objects.create(student=self.student, course=self.course)

        self.detail_url = reverse("instructor-detail", args=[self.teacher.id])
        self.feedback_url = reverse("instructor-feedback", args=[self.teacher.id])


class InstructorDetailTests(InstructorTestCase):
    def test_public_profile_does_not_require_login_and_hides_contact_details(self):
        response = self.client.get(self.detail_url)

        data = response.data["data"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["name"], self.teacher.name)
        self.assertEqual(data["stats"]["courses"], 1)
        self.assertEqual(data["stats"]["students"], 1)
        self.assertEqual([c["id"] for c in data["courses"]], [self.course.id])
        self.assertNotIn(self.teacher.email, str(data))

    def test_teacher_without_published_course_is_not_found(self):
        url = reverse("instructor-detail", args=[self.idle_teacher.id])
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_students_and_unknown_ids_are_not_found(self):
        self.assertEqual(
            self.client.get(reverse("instructor-detail", args=[self.student.id])).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.get(reverse("instructor-detail", args=[999999])).status_code,
            status.HTTP_404_NOT_FOUND,
        )


class InstructorFeedbackTests(InstructorTestCase):
    def _post(self, **payload):
        return self.client.post(
            self.feedback_url,
            {"course": self.course.id, "rating": 5, "comment": "Great", **payload},
            format="json",
        )

    def test_enrolled_student_can_leave_and_update_feedback(self):
        self.client.force_authenticate(self.student)

        created = self._post()
        updated = self._post(rating=4, comment="Still great")

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(InstructorFeedback.objects.count(), 1)
        self.assertEqual(InstructorFeedback.objects.get().rating, 4)

    def test_not_enrolled_student_is_forbidden(self):
        self.client.force_authenticate(self.outsider)

        self.assertEqual(self._post().status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(InstructorFeedback.objects.count(), 0)

    def test_cancelled_enrollment_cannot_review(self):
        Enrollment.objects.filter(student=self.student).update(
            status=Enrollment.EnrollmentStatus.CANCELLED
        )
        self.client.force_authenticate(self.student)

        self.assertEqual(self._post().status_code, status.HTTP_403_FORBIDDEN)

    def test_teachers_and_guests_cannot_post(self):
        self.assertIn(self._post().status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self._post().status_code, status.HTTP_403_FORBIDDEN)

    def test_rating_must_be_between_one_and_five(self):
        self.client.force_authenticate(self.student)

        self.assertEqual(self._post(rating=0).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self._post(rating=6).status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_list_masks_student_name_and_updates_stats(self):
        InstructorFeedback.objects.create(
            instructor=self.teacher, student=self.student, course=self.course, rating=4, comment="Nice"
        )

        listed = self.client.get(self.feedback_url)
        detail = self.client.get(self.detail_url)

        item = listed.data["data"]["results"][0]
        self.assertEqual(item["student_name"], "Dot B.")
        self.assertEqual(item["course"]["title"], "Claude Masterclass")
        self.assertNotIn("stud@example.com", str(listed.data))
        self.assertEqual(detail.data["data"]["stats"]["reviews"], 1)
        self.assertEqual(detail.data["data"]["stats"]["rating"], 4.0)

    def test_eligibility_lists_enrolled_courses_with_existing_feedback(self):
        self.client.force_authenticate(self.student)
        self._post()

        response = self.client.get(reverse("instructor-feedback-eligibility", args=[self.teacher.id]))

        data = response.data["data"]
        self.assertEqual([entry["course"]["id"] for entry in data], [self.course.id])
        self.assertEqual(data[0]["feedback"]["rating"], 5)

        self.client.force_authenticate(self.outsider)
        empty = self.client.get(reverse("instructor-feedback-eligibility", args=[self.teacher.id]))
        self.assertEqual(empty.data["data"], [])

    def test_student_can_delete_own_feedback_only(self):
        InstructorFeedback.objects.create(
            instructor=self.teacher, student=self.student, course=self.course, rating=5
        )
        url = reverse("instructor-feedback-detail", args=[self.teacher.id, self.course.id])

        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(InstructorFeedback.objects.count(), 1)

        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_200_OK)
        self.assertEqual(InstructorFeedback.objects.count(), 0)


class MyInstructorProfileTests(InstructorTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("instructor-my-profile")

    def test_teacher_can_update_profile_and_it_appears_publicly(self):
        self.client.force_authenticate(self.teacher)

        response = self.client.patch(
            self.url,
            {
                "headline": "  AI   Educator ",
                "bio": "I teach things.",
                "website": "https://example.com",
                "linkedin_url": "https://linkedin.com/in/ryan",
                "skills": ["AI", " ai ", "Cloud", ""],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        public = self.client.get(self.detail_url).data["data"]
        self.assertEqual(public["headline"], "AI Educator")
        self.assertEqual(public["bio"], "I teach things.")
        self.assertEqual(public["skills"], ["AI", "Cloud"])
        self.assertEqual(public["linkedin_url"], "https://linkedin.com/in/ryan")

    def test_multipart_accepts_skills_as_json_string(self):
        self.client.force_authenticate(self.teacher)

        response = self.client.patch(
            self.url, {"headline": "Hi", "skills": '["A", "B"]'}, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["skills"], ["A", "B"])

    def test_rejects_bad_urls_and_too_many_skills(self):
        self.client.force_authenticate(self.teacher)

        bad_url = self.client.patch(self.url, {"website": "not a url"}, format="json")
        too_many = self.client.patch(
            self.url, {"skills": [f"Skill {i}" for i in range(13)]}, format="json"
        )

        self.assertEqual(bad_url.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(too_many.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_teachers_can_manage_a_profile(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(self.url, {}, format="json").status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_sees_received_feedback(self):
        InstructorFeedback.objects.create(
            instructor=self.teacher, student=self.student, course=self.course, rating=5, comment="Loved it"
        )
        self.client.force_authenticate(self.teacher)

        response = self.client.get(reverse("instructor-my-feedback"))

        self.assertEqual(response.data["data"]["results"][0]["comment"], "Loved it")
        self.assertEqual(response.data["data"]["summary"]["reviews"], 1)


class CourseFeedbackTests(InstructorTestCase):
    def test_course_feedback_lists_reviews_with_summary(self):
        InstructorFeedback.objects.create(
            instructor=self.teacher, student=self.student, course=self.course, rating=4, comment="Good"
        )

        response = self.client.get(reverse("course-instructor-feedback", args=[self.course.slug]))

        data = response.data["data"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["summary"], {"reviews": 1, "rating": 4.0})
        self.assertEqual(data["results"][0]["instructor"]["name"], self.teacher.name)
        self.assertEqual(data["results"][0]["student_name"], "Dot B.")

    def test_unpublished_or_unknown_course_is_not_found(self):
        self.assertEqual(
            self.client.get(reverse("course-instructor-feedback", args=[self.draft.slug])).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.get(reverse("course-instructor-feedback", args=["nope"])).status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_public_course_detail_includes_instructor_card_without_email(self):
        response = self.client.get(reverse("course-public-detail", args=[self.course.slug]))

        card = response.data["data"]["instructors"][0]
        self.assertEqual(
            set(card.keys()),
            {"id", "user_id", "name", "is_lead", "headline", "bio", "avatar", "stats"},
        )
        self.assertEqual(card["stats"]["courses"], 1)
        self.assertNotIn(self.teacher.email, str(response.data))


def make_image(name="photo.png", size=(40, 40)):
    buffer = io.BytesIO()
    Image.new("RGB", size, "teal").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


class InstructorPhotoTests(InstructorTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("instructor-my-profile")
        self.media = tempfile.mkdtemp()
        override = override_settings(MEDIA_ROOT=self.media)
        override.enable()
        self.addCleanup(override.disable)
        self.addCleanup(shutil.rmtree, self.media, ignore_errors=True)

    def test_teacher_can_upload_a_photo_shown_publicly_and_on_course_page(self):
        self.client.force_authenticate(self.teacher)

        response = self.client.patch(self.url, {"avatar": make_image()}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("/media/avatars/", response.data["data"]["avatar"])
        public = self.client.get(self.detail_url).data["data"]
        self.assertEqual(public["avatar"], response.data["data"]["avatar"])
        course = self.client.get(reverse("course-public-detail", args=[self.course.slug])).data["data"]
        self.assertEqual(course["instructors"][0]["avatar"], response.data["data"]["avatar"])

    def test_teacher_can_remove_the_photo(self):
        self.client.force_authenticate(self.teacher)
        self.client.patch(self.url, {"avatar": make_image()}, format="multipart")

        response = self.client.patch(self.url, {"remove_avatar": "true"}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["data"]["avatar"])

    def test_rejects_non_images_and_oversized_photos(self):
        self.client.force_authenticate(self.teacher)
        fake = SimpleUploadedFile("notes.png", b"not an image", content_type="image/png")
        big = SimpleUploadedFile("big.png", make_image().read() + b"0" * (5 * 1024 * 1024), content_type="image/png")

        self.assertEqual(
            self.client.patch(self.url, {"avatar": fake}, format="multipart").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.patch(self.url, {"avatar": big}, format="multipart").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_updating_text_fields_keeps_the_existing_photo(self):
        self.client.force_authenticate(self.teacher)
        first = self.client.patch(self.url, {"avatar": make_image()}, format="multipart")

        second = self.client.patch(self.url, {"headline": "New headline"}, format="multipart")

        self.assertEqual(second.data["data"]["avatar"], first.data["data"]["avatar"])
        self.assertEqual(second.data["data"]["headline"], "New headline")
