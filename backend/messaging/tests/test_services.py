from django.contrib.auth import get_user_model
from django.test import TestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from ..models import Conversation, Message, MessageReaction
from ..services import (
    MessageDeleteError,
    MessageEditError,
    MessagingPermissionError,
    can_message,
    delete_message,
    edit_message,
    get_eligible_recipients,
    get_or_create_conversation,
    get_unread_counts,
    mark_conversation_read,
    send_message,
    start_conversation,
    toggle_reaction,
)

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


class EligibilityTests(TestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher_a = make_user("teacher.a@example.com", UserModel.Roles.TEACHER)
        self.teacher_b = make_user("teacher.b@example.com", UserModel.Roles.TEACHER)
        self.student_a = make_user("student.a@example.com", UserModel.Roles.STUDENT)
        self.student_b = make_user("student.b@example.com", UserModel.Roles.STUDENT)

        category = Category.objects.create(name="Academics")
        self.course = Course.objects.create(
            title="Course A", code="CA101", category=category, status=Status.PUBLISHED
        )
        CourseInstructor.objects.create(course=self.course, instructor=self.teacher_a)
        Enrollment.objects.create(student=self.student_a, course=self.course)

    def test_admin_can_message_any_teacher_or_student(self):
        recipients = get_eligible_recipients(self.admin)
        self.assertIn(self.teacher_a, recipients)
        self.assertIn(self.teacher_b, recipients)
        self.assertIn(self.student_a, recipients)
        self.assertIn(self.student_b, recipients)

    def test_teacher_can_message_admin_and_their_own_students_only(self):
        recipients = get_eligible_recipients(self.teacher_a)
        self.assertIn(self.admin, recipients)
        self.assertIn(self.student_a, recipients)
        self.assertNotIn(self.student_b, recipients)
        self.assertNotIn(self.teacher_b, recipients)

    def test_student_can_message_admin_and_their_own_teachers_only(self):
        recipients = get_eligible_recipients(self.student_a)
        self.assertIn(self.admin, recipients)
        self.assertIn(self.teacher_a, recipients)
        self.assertNotIn(self.teacher_b, recipients)
        self.assertNotIn(self.student_b, recipients)

    def test_unrelated_student_cannot_message_unrelated_teacher(self):
        self.assertFalse(can_message(self.student_b, self.teacher_a))
        self.assertFalse(can_message(self.teacher_a, self.student_b))

    def test_related_student_and_teacher_can_message_each_other(self):
        self.assertTrue(can_message(self.student_a, self.teacher_a))
        self.assertTrue(can_message(self.teacher_a, self.student_a))

    def test_student_cannot_message_another_student(self):
        self.assertFalse(can_message(self.student_a, self.student_b))

    def test_teacher_cannot_message_another_teacher(self):
        self.assertFalse(can_message(self.teacher_a, self.teacher_b))

    def test_user_cannot_message_themselves(self):
        self.assertFalse(can_message(self.student_a, self.student_a))

    def test_start_conversation_rejects_ineligible_pair(self):
        with self.assertRaises(MessagingPermissionError):
            start_conversation(self.student_b, self.teacher_a)

    def test_start_conversation_succeeds_for_eligible_pair(self):
        conversation = start_conversation(self.student_a, self.teacher_a)
        self.assertIsInstance(conversation, Conversation)


class ConversationServiceTests(TestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = make_user("teacher@example.com", UserModel.Roles.TEACHER)

    def test_get_or_create_conversation_is_idempotent_regardless_of_argument_order(self):
        conversation_1 = get_or_create_conversation(self.admin, self.teacher)
        conversation_2 = get_or_create_conversation(self.teacher, self.admin)

        self.assertEqual(conversation_1.id, conversation_2.id)
        self.assertEqual(Conversation.objects.count(), 1)

    def test_get_or_create_conversation_canonicalizes_participant_order(self):
        conversation = get_or_create_conversation(self.teacher, self.admin)
        lo, hi = sorted([self.admin, self.teacher], key=lambda u: u.pk)
        self.assertEqual(conversation.participant_one_id, lo.pk)
        self.assertEqual(conversation.participant_two_id, hi.pk)

    def test_send_message_updates_conversation_last_message_at(self):
        conversation = get_or_create_conversation(self.admin, self.teacher)
        self.assertIsNone(conversation.last_message_at)

        message = send_message(conversation, self.admin, "Hello")
        conversation.refresh_from_db()

        self.assertEqual(conversation.last_message_at, message.created_at)
        self.assertEqual(message.sender, self.admin)
        self.assertFalse(message.is_read)

    def test_mark_conversation_read_only_marks_messages_from_other_participant(self):
        conversation = get_or_create_conversation(self.admin, self.teacher)
        send_message(conversation, self.admin, "From admin")
        send_message(conversation, self.teacher, "From teacher")

        mark_conversation_read(conversation, self.teacher)

        admin_message = Message.objects.get(sender=self.admin)
        teacher_message = Message.objects.get(sender=self.teacher)
        self.assertTrue(admin_message.is_read)
        self.assertIsNotNone(admin_message.read_at)
        self.assertFalse(teacher_message.is_read)

    def test_get_unread_counts_excludes_own_messages(self):
        conversation = get_or_create_conversation(self.admin, self.teacher)
        send_message(conversation, self.admin, "From admin")
        send_message(conversation, self.admin, "From admin again")

        admin_counts = get_unread_counts(self.admin)
        teacher_counts = get_unread_counts(self.teacher)

        self.assertEqual(admin_counts["unread_messages"], 0)
        self.assertEqual(teacher_counts["unread_messages"], 2)
        self.assertEqual(teacher_counts["unread_conversations"], 1)

    def test_get_unread_counts_after_mark_read_drops_to_zero(self):
        conversation = get_or_create_conversation(self.admin, self.teacher)
        send_message(conversation, self.admin, "From admin")
        mark_conversation_read(conversation, self.teacher)

        teacher_counts = get_unread_counts(self.teacher)
        self.assertEqual(teacher_counts["unread_messages"], 0)
        self.assertEqual(teacher_counts["unread_conversations"], 0)


class MessageEditDeleteServiceTests(TestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = make_user("teacher@example.com", UserModel.Roles.TEACHER)
        self.conversation = get_or_create_conversation(self.admin, self.teacher)

    def test_sender_can_edit_own_message(self):
        message = send_message(self.conversation, self.admin, "Original")
        edited = edit_message(message, self.admin, "Updated")

        self.assertEqual(edited.body, "Updated")
        self.assertTrue(edited.is_edited)
        self.assertIsNotNone(edited.edited_at)

    def test_non_sender_cannot_edit_message(self):
        message = send_message(self.conversation, self.admin, "Original")
        with self.assertRaises(MessageEditError):
            edit_message(message, self.teacher, "Hacked")

    def test_deleted_message_cannot_be_edited(self):
        message = send_message(self.conversation, self.admin, "Original")
        delete_message(message, self.admin)
        with self.assertRaises(MessageEditError):
            edit_message(message, self.admin, "Updated")

    def test_sender_can_delete_own_message_and_body_is_cleared(self):
        message = send_message(self.conversation, self.admin, "Secret")
        deleted = delete_message(message, self.admin)

        self.assertTrue(deleted.is_deleted)
        self.assertIsNotNone(deleted.deleted_at)
        self.assertEqual(deleted.body, "")

    def test_non_sender_cannot_delete_message(self):
        message = send_message(self.conversation, self.admin, "Secret")
        with self.assertRaises(MessageDeleteError):
            delete_message(message, self.teacher)

    def test_deleting_twice_is_a_no_op(self):
        message = send_message(self.conversation, self.admin, "Secret")
        delete_message(message, self.admin)
        deleted_again = delete_message(message, self.admin)
        self.assertTrue(deleted_again.is_deleted)


class MessageReactionServiceTests(TestCase):
    def setUp(self):
        self.admin = make_user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = make_user("teacher@example.com", UserModel.Roles.TEACHER)
        self.conversation = get_or_create_conversation(self.admin, self.teacher)
        self.message = send_message(self.conversation, self.admin, "Hello")

    def test_reacting_creates_a_reaction(self):
        toggle_reaction(self.message, self.teacher, "👍")
        self.assertEqual(MessageReaction.objects.filter(message=self.message).count(), 1)
        reaction = MessageReaction.objects.get(message=self.message, user=self.teacher)
        self.assertEqual(reaction.emoji, "👍")

    def test_reacting_with_same_emoji_again_removes_it(self):
        toggle_reaction(self.message, self.teacher, "👍")
        toggle_reaction(self.message, self.teacher, "👍")
        self.assertEqual(MessageReaction.objects.filter(message=self.message).count(), 0)

    def test_reacting_with_a_different_emoji_replaces_the_old_one(self):
        toggle_reaction(self.message, self.teacher, "👍")
        toggle_reaction(self.message, self.teacher, "❤️")

        self.assertEqual(MessageReaction.objects.filter(message=self.message).count(), 1)
        reaction = MessageReaction.objects.get(message=self.message, user=self.teacher)
        self.assertEqual(reaction.emoji, "❤️")

    def test_sender_can_react_to_their_own_message(self):
        toggle_reaction(self.message, self.admin, "🔥")
        self.assertTrue(
            MessageReaction.objects.filter(message=self.message, user=self.admin, emoji="🔥").exists()
        )

    def test_two_users_can_react_independently(self):
        toggle_reaction(self.message, self.admin, "🔥")
        toggle_reaction(self.message, self.teacher, "👍")
        self.assertEqual(MessageReaction.objects.filter(message=self.message).count(), 2)
