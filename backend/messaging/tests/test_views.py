from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from ..models import Conversation, MessageReaction
from ..services import get_or_create_conversation, send_message

UserModel = get_user_model()


def make_user(email, role, **extra):
    return UserModel.objects.create_user(
        username=email.split("@")[0],
        email=email,
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
        **extra,
    )


class MessagingTestCase(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = make_user("teacher@example.com", UserModel.Roles.TEACHER)
        self.other_teacher = make_user("other.teacher@example.com", UserModel.Roles.TEACHER)
        self.student = make_user("student@example.com", UserModel.Roles.STUDENT)
        self.other_student = make_user("other.student@example.com", UserModel.Roles.STUDENT)

        category = Category.objects.create(name="Academics")
        self.course = Course.objects.create(
            title="Course A", code="CA101", category=category, status=Status.PUBLISHED
        )
        CourseInstructor.objects.create(course=self.course, instructor=self.teacher)
        Enrollment.objects.create(student=self.student, course=self.course)


class EnvelopeAndAuthTests(MessagingTestCase):
    def test_anonymous_cannot_list_conversations(self):
        response = self.client.get(reverse("conversation-list-create"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_response_uses_success_envelope_shape(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("conversation-list-create"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        self.assertIn("message", response.data)
        self.assertIn("data", response.data)
        self.assertNotIn("detail", response.data)


class RecipientsViewTests(MessagingTestCase):
    def test_teacher_recipients_include_admin_and_own_students_only(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(reverse("messaging-recipients"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {row["id"] for row in response.data["data"]}
        self.assertIn(self.admin.id, ids)
        self.assertIn(self.student.id, ids)
        self.assertNotIn(self.other_student.id, ids)

    def test_student_recipients_include_admin_and_own_teachers_only(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("messaging-recipients"))
        ids = {row["id"] for row in response.data["data"]}
        self.assertIn(self.admin.id, ids)
        self.assertIn(self.teacher.id, ids)
        self.assertNotIn(self.other_teacher.id, ids)

    def test_search_filters_recipients_by_email_substring(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("messaging-recipients"), {"search": "other.student"})
        ids = {row["id"] for row in response.data["data"]}
        self.assertEqual(ids, {self.other_student.id})

    def test_search_filters_recipients_by_name(self):
        named_student = make_user(
            "zendaya@example.com", UserModel.Roles.STUDENT, first_name="Zendaya", last_name="Example"
        )
        Enrollment.objects.create(student=named_student, course=self.course)

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(reverse("messaging-recipients"), {"search": "zendaya"})

        ids = {row["id"] for row in response.data["data"]}
        self.assertEqual(ids, {named_student.id})

    def test_search_with_no_matches_returns_empty_list(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("messaging-recipients"), {"search": "nobody-has-this-name"})
        self.assertEqual(response.data["data"], [])

    def test_recipients_are_capped_at_twenty(self):
        # Admin eligibility isn't course-scoped (any teacher/student qualifies),
        # so plain bulk user creation is enough to exceed the cap.
        for i in range(25):
            make_user(f"bulk{i}@example.com", UserModel.Roles.STUDENT)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("messaging-recipients"))

        self.assertEqual(len(response.data["data"]), 20)


class ConversationCreateTests(MessagingTestCase):
    def test_admin_can_start_conversation_with_teacher(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("conversation-list-create"), {"recipient_id": self.teacher.id}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Conversation.objects.count(), 1)

    def test_starting_conversation_twice_reuses_the_same_row(self):
        self.client.force_authenticate(user=self.admin)
        first = self.client.post(reverse("conversation-list-create"), {"recipient_id": self.teacher.id})
        second = self.client.post(reverse("conversation-list-create"), {"recipient_id": self.teacher.id})

        self.assertEqual(first.data["data"]["id"], second.data["data"]["id"])
        self.assertEqual(Conversation.objects.count(), 1)

    def test_student_cannot_start_conversation_with_unrelated_teacher(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("conversation-list-create"), {"recipient_id": self.other_teacher.id}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_student_cannot_message_another_student(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("conversation-list-create"), {"recipient_id": self.other_student.id}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonexistent_recipient_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse("conversation-list-create"), {"recipient_id": 999999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MessageViewTests(MessagingTestCase):
    def setUp(self):
        super().setUp()
        self.conversation = get_or_create_conversation(self.admin, self.teacher)

    def test_participant_can_list_messages(self):
        send_message(self.conversation, self.admin, "Hello teacher")
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(
            reverse("conversation-messages", args=[self.conversation.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)

    def test_non_participant_cannot_list_messages(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.get(
            reverse("conversation-messages", args=[self.conversation.id])
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_participant_can_send_message(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("conversation-messages", args=[self.conversation.id]), {"body": "Hi there"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["sender_id"], self.admin.id)
        self.assertEqual(self.conversation.messages.count(), 1)

    def test_non_participant_cannot_send_message(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.post(
            reverse("conversation-messages", args=[self.conversation.id]), {"body": "Hi there"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.conversation.messages.count(), 0)

    def test_empty_body_is_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("conversation-messages", args=[self.conversation.id]), {"body": "   "}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_conversation_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("conversation-messages", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MarkReadViewTests(MessagingTestCase):
    def setUp(self):
        super().setUp()
        self.conversation = get_or_create_conversation(self.admin, self.teacher)
        send_message(self.conversation, self.admin, "Unread from admin")

    def test_participant_can_mark_conversation_read(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            reverse("conversation-read", args=[self.conversation.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["unread_count"], 0)

    def test_non_participant_cannot_mark_conversation_read(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.patch(
            reverse("conversation-read", args=[self.conversation.id])
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UnreadCountViewTests(MessagingTestCase):
    def test_unread_count_reflects_pending_messages(self):
        conversation = get_or_create_conversation(self.admin, self.teacher)
        send_message(conversation, self.admin, "Ping")

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(reverse("messaging-unread-count"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["unread_messages"], 1)
        self.assertEqual(response.data["data"]["unread_conversations"], 1)


class MessageEditDeleteViewTests(MessagingTestCase):
    def setUp(self):
        super().setUp()
        self.conversation = get_or_create_conversation(self.admin, self.teacher)
        self.message = send_message(self.conversation, self.admin, "Original")

    def test_sender_can_edit_own_message(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("message-detail", args=[self.conversation.id, self.message.id]),
            {"body": "Updated"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["body"], "Updated")
        self.assertTrue(response.data["data"]["is_edited"])

    def test_non_sender_cannot_edit_message(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            reverse("message-detail", args=[self.conversation.id, self.message.id]),
            {"body": "Hacked"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_participant_cannot_edit_message(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.patch(
            reverse("message-detail", args=[self.conversation.id, self.message.id]),
            {"body": "Hacked"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_edit_rejects_empty_body(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("message-detail", args=[self.conversation.id, self.message.id]),
            {"body": "   "},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sender_can_delete_own_message(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            reverse("message-detail", args=[self.conversation.id, self.message.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["is_deleted"])
        self.assertEqual(response.data["data"]["body"], "")

    def test_non_sender_cannot_delete_message(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.delete(
            reverse("message-detail", args=[self.conversation.id, self.message.id])
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deleted_message_hides_body_when_listed(self):
        self.client.force_authenticate(user=self.admin)
        self.client.delete(reverse("message-detail", args=[self.conversation.id, self.message.id]))

        response = self.client.get(
            reverse("conversation-messages", args=[self.conversation.id])
        )
        deleted_row = next(
            row for row in response.data["data"]["results"] if row["id"] == self.message.id
        )
        self.assertTrue(deleted_row["is_deleted"])
        self.assertEqual(deleted_row["body"], "")
        self.assertIsNone(deleted_row["attachment"])

    def test_nonexistent_message_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("message-detail", args=[self.conversation.id, 999999]), {"body": "x"}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MessageReactionViewTests(MessagingTestCase):
    def setUp(self):
        super().setUp()
        self.conversation = get_or_create_conversation(self.admin, self.teacher)
        self.message = send_message(self.conversation, self.admin, "Hello")

    def test_participant_can_react_to_a_message(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("message-reactions", args=[self.conversation.id, self.message.id]),
            {"emoji": "👍"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reactions = response.data["data"]["reactions"]
        self.assertEqual(reactions, [{"emoji": "👍", "count": 1, "reacted_by_me": True}])

    def test_reacting_twice_with_same_emoji_toggles_it_off(self):
        self.client.force_authenticate(user=self.teacher)
        url = reverse("message-reactions", args=[self.conversation.id, self.message.id])
        self.client.post(url, {"emoji": "👍"})
        response = self.client.post(url, {"emoji": "👍"})

        self.assertEqual(response.data["data"]["reactions"], [])
        self.assertEqual(MessageReaction.objects.count(), 0)

    def test_sender_can_react_to_own_message(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("message-reactions", args=[self.conversation.id, self.message.id]),
            {"emoji": "🔥"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_participant_cannot_react(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.post(
            reverse("message-reactions", args=[self.conversation.id, self.message.id]),
            {"emoji": "👍"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_emoji_is_rejected(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("message-reactions", args=[self.conversation.id, self.message.id]),
            {"emoji": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MessageAttachmentViewTests(MessagingTestCase):
    def setUp(self):
        super().setUp()
        self.conversation = get_or_create_conversation(self.admin, self.teacher)
        self.url = reverse("conversation-messages", args=[self.conversation.id])

    def test_can_send_a_message_with_an_image_attachment_and_no_body(self):
        self.client.force_authenticate(user=self.admin)
        image = SimpleUploadedFile("photo.png", b"fake-image-bytes", content_type="image/png")
        response = self.client.post(self.url, {"attachment": image}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data["data"]
        self.assertEqual(data["attachment_type"], "IMAGE")
        self.assertEqual(data["attachment_original_name"], "photo.png")
        self.assertIsNotNone(data["attachment"])

    def test_can_send_a_message_with_body_and_attachment_together(self):
        self.client.force_authenticate(user=self.admin)
        doc = SimpleUploadedFile("notes.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        response = self.client.post(
            self.url, {"body": "See attached", "attachment": doc}, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data["data"]
        self.assertEqual(data["body"], "See attached")
        self.assertEqual(data["attachment_type"], "DOCUMENT")

    def test_unsupported_file_extension_is_rejected(self):
        self.client.force_authenticate(user=self.admin)
        bad_file = SimpleUploadedFile("virus.exe", b"binary", content_type="application/octet-stream")
        response = self.client.post(self.url, {"attachment": bad_file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oversized_image_is_rejected(self):
        self.client.force_authenticate(user=self.admin)
        oversized = SimpleUploadedFile(
            "big.png", b"0" * (11 * 1024 * 1024), content_type="image/png"
        )
        response = self.client.post(self.url, {"attachment": oversized}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_message_with_neither_body_nor_attachment_is_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
