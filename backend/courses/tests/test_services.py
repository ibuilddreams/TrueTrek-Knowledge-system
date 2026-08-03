from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from assignments.models import Assignment, AssignmentSubmission
from common.models import Status
from enrollments.models import Enrollment

from ..models import Category, Course
from ..services import get_course_students_detail

UserModel = get_user_model()


class GetCourseStudentsDetailTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.student = UserModel.objects.create_user(
            username="servicestudent",
            email="servicestudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        Enrollment.objects.create(student=self.student, course=self.course)

    def test_assignment_counts_reflect_real_submissions(self):
        assignment = Assignment.objects.create(
            course=self.course,
            title="Assignment 1",
            due_date=timezone.now() + timezone.timedelta(days=7),
            total_marks=100,
            status=Status.PUBLISHED,
        )
        Assignment.objects.create(
            course=self.course,
            title="Assignment 2 (draft, excluded)",
            due_date=timezone.now() + timezone.timedelta(days=7),
            total_marks=100,
            status=Status.DRAFT,
        )
        AssignmentSubmission.objects.create(
            assignment=assignment,
            student=self.student,
            submitted_at=timezone.now(),
            status=AssignmentSubmission.SubmissionStatus.SUBMITTED,
        )

        details = get_course_students_detail(self.course)

        self.assertEqual(len(details), 1)
        self.assertEqual(details[0]["assignments"], {"submitted": 1, "total": 1})

    def test_assignment_counts_are_zero_with_no_assignments(self):
        details = get_course_students_detail(self.course)

        self.assertEqual(details[0]["assignments"], {"submitted": 0, "total": 0})
