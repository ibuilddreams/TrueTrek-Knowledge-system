from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from assignments.models import Assignment
from common.models import Status
from common.ordering import get_next_order
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Choice, Question, Quiz

User = get_user_model()

DEFAULT_PASSWORD = "Password@123"

ADMIN_DATA = {
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
}

TEACHER_DATA = [
    {"email": f"teacher{i}@example.com", "first_name": "Teacher", "last_name": str(i)}
    for i in range(1, 7)
]

STUDENT_DATA = [
    {"email": f"student{i}@example.com", "first_name": "Student", "last_name": str(i)}
    for i in range(1, 13)
]

COURSE_COUNT = 8
MODULES_PER_COURSE = 5
LESSONS_PER_MODULE = 5
ASSIGNMENTS_PER_MODULE = 2

YOUTUBE_DEMO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Cycled across a module's lessons so every module gets a mix of content types,
# including a YouTube-embedded video lesson as requested.
LESSON_CONTENT_CYCLE = [
    {
        "content_type": Lesson.ContentType.VIDEO,
        "video_url": YOUTUBE_DEMO_URL,
        "content_data": "",
        "duration_minutes": 12,
    },
    {
        "content_type": Lesson.ContentType.PDF,
        "video_url": None,
        "content_data": "Reference PDF material for this lesson.",
        "duration_minutes": None,
    },
    {
        "content_type": Lesson.ContentType.DOCUMENT,
        "video_url": None,
        "content_data": "Supplementary document covering this lesson's topic.",
        "duration_minutes": None,
    },
    {
        "content_type": Lesson.ContentType.TEXT,
        "video_url": None,
        "content_data": "Written lesson content for students to read through.",
        "duration_minutes": 8,
    },
]

# Reused for every quiz: a 10-question mix of MCQ (4 choices each), True/False
# (2 choices each), and Short Answer (no choices), matching what the quiz
# builder UI now enforces.
QUESTION_TEMPLATES = [
    {
        "type": Question.QuestionType.MCQ,
        "text": "What is the capital of France?",
        "marks": 2,
        "choices": [("Paris", True), ("Berlin", False), ("Rome", False), ("Madrid", False)],
    },
    {
        "type": Question.QuestionType.MCQ,
        "text": "Which planet is known as the Red Planet?",
        "marks": 2,
        "choices": [("Mars", True), ("Venus", False), ("Jupiter", False), ("Saturn", False)],
    },
    {
        "type": Question.QuestionType.MCQ,
        "text": "What is the chemical formula for water?",
        "marks": 2,
        "choices": [("H2O", True), ("CO2", False), ("O2", False), ("NaCl", False)],
    },
    {
        "type": Question.QuestionType.MCQ,
        "text": "Which language is primarily used for styling web pages?",
        "marks": 2,
        "choices": [("CSS", True), ("HTML", False), ("JavaScript", False), ("Python", False)],
    },
    {
        "type": Question.QuestionType.MCQ,
        "text": "What is the largest ocean on Earth?",
        "marks": 2,
        "choices": [
            ("Pacific Ocean", True),
            ("Atlantic Ocean", False),
            ("Indian Ocean", False),
            ("Arctic Ocean", False),
        ],
    },
    {
        "type": Question.QuestionType.TRUE_FALSE,
        "text": "The sun rises in the west.",
        "marks": 2,
        "choices": [("True", False), ("False", True)],
    },
    {
        "type": Question.QuestionType.TRUE_FALSE,
        "text": "Python is a programming language.",
        "marks": 2,
        "choices": [("True", True), ("False", False)],
    },
    {
        "type": Question.QuestionType.TRUE_FALSE,
        "text": "The Great Wall of China is visible from space with the naked eye.",
        "marks": 2,
        "choices": [("True", False), ("False", True)],
    },
    {
        "type": Question.QuestionType.SHORT_ANSWER,
        "text": "Briefly explain the main concept covered in this module.",
        "marks": 3,
        "choices": [],
    },
    {
        "type": Question.QuestionType.SHORT_ANSWER,
        "text": "Describe one real-world application of this module's topic.",
        "marks": 3,
        "choices": [],
    },
]


class Command(BaseCommand):
    help = (
        "Seeds the database with demo users, courses, modules, lessons, assignments, "
        "quizzes and enrollments. Safe to re-run: existing rows are looked up with "
        "get_or_create and are never overwritten."
    )

    def handle(self, *args, **options):
        with transaction.atomic():
            self._create_user(ADMIN_DATA, User.Roles.ADMIN)
            self.stdout.write(self.style.SUCCESS("Created 1 admin"))

            teachers = [self._create_user(data, User.Roles.TEACHER) for data in TEACHER_DATA]
            self.stdout.write(self.style.SUCCESS(f"Created {len(teachers)} teachers"))

            students = [self._create_user(data, User.Roles.STUDENT) for data in STUDENT_DATA]
            self.stdout.write(self.style.SUCCESS(f"Created {len(students)} students"))

            category, _ = Category.objects.get_or_create(name="General")

            courses = self._create_courses(category, teachers)
            self.stdout.write(self.style.SUCCESS(f"Created {len(courses)} courses"))

            course_instructor_map = {
                ci.course_id: ci.instructor
                for ci in CourseInstructor.objects.filter(course__in=courses, is_lead=True)
            }

            modules = self._create_modules(courses)
            self.stdout.write(self.style.SUCCESS(f"Created {len(modules)} modules"))

            lessons = self._create_lessons(modules)
            self.stdout.write(self.style.SUCCESS(f"Created {len(lessons)} lessons"))

            assignments = self._create_assignments(modules, course_instructor_map)
            self.stdout.write(self.style.SUCCESS(f"Created {len(assignments)} assignments"))

            quizzes = self._create_quizzes(modules)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created {len(quizzes)} quizzes with {len(QUESTION_TEMPLATES)} questions each"
                )
            )

            enrollments = self._create_enrollments(students, courses)
            self.stdout.write(self.style.SUCCESS(f"Created {len(enrollments)} enrollments"))

        self.stdout.write(self.style.SUCCESS("Seed data completed successfully."))

    def _create_user(self, data, role):
        username = data["email"]
        user, created = User.objects.get_or_create(
            email=data["email"],
            defaults={
                "username": username,
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "gender": User.Gender.OTHER,
                "role": role,
                "is_verified": True,
                "is_staff": role == User.Roles.ADMIN,
                "is_superuser": role == User.Roles.ADMIN,
            },
        )
        if created:
            user.set_password(DEFAULT_PASSWORD)
            user.save(update_fields=["password"])
        return user

    def _create_courses(self, category, teachers):
        courses = []
        for i in range(1, COURSE_COUNT + 1):
            course, _ = Course.objects.get_or_create(
                title=f"Course {i}",
                defaults={
                    "code": f"COURSE{i}",
                    "description": f"Demo course {i}",
                    "category": category,
                    "status": Status.PUBLISHED,
                },
            )
            if not course.code:
                course.code = f"COURSE{i}"
                course.save(update_fields=["code"])
            teacher = teachers[(i - 1) % len(teachers)]
            CourseInstructor.objects.update_or_create(
                course=course,
                instructor=teacher,
                defaults={"is_lead": True},
            )
            courses.append(course)
        return courses

    def _create_modules(self, courses):
        modules = []
        for course in courses:
            for order in range(1, MODULES_PER_COURSE + 1):
                module, _ = Module.objects.get_or_create(
                    course=course,
                    title=f"{course.title} - Module {order}",
                    defaults={
                        "description": f"Module {order} of {course.title}",
                        "order": order,
                    },
                )
                modules.append(module)
        return modules

    def _create_lessons(self, modules):
        lessons = []
        for module in modules:
            for order in range(1, LESSONS_PER_MODULE + 1):
                spec = LESSON_CONTENT_CYCLE[(order - 1) % len(LESSON_CONTENT_CYCLE)]
                lesson, _ = Lesson.objects.get_or_create(
                    module=module,
                    title=f"{module.title} - Lesson {order}",
                    defaults={
                        "description": f"Lesson {order} of {module.title}",
                        "content_type": spec["content_type"],
                        "content_data": spec["content_data"],
                        "video_url": spec["video_url"],
                        "duration_minutes": spec["duration_minutes"],
                        "order": order,
                    },
                )
                lessons.append(lesson)
        return lessons

    def _create_assignments(self, modules, course_instructor_map):
        # Assignment.order is uniquely constrained per module, and modules may already
        # have unrelated assignments (created manually through the app). Look up by
        # title only, and compute a fresh order at creation time so we never collide
        # with orders already taken by pre-existing rows.
        assignments = []
        now = timezone.now()
        for module in modules:
            instructor = course_instructor_map.get(module.course_id)
            for i in range(1, ASSIGNMENTS_PER_MODULE + 1):
                title = f"{module.title} - Assignment {i}"
                assignment = Assignment.objects.filter(module=module, title=title).first()
                if assignment is None:
                    is_even = i % 2 == 0
                    assignment = Assignment.objects.create(
                        module=module,
                        title=title,
                        course=module.course,
                        description=f"Assignment {i} for {module.title}",
                        due_date=now + timedelta(days=7 * i),
                        total_marks=50,
                        status=Status.PUBLISHED,
                        grading_mode=(
                            Assignment.GradingMode.AUTO if is_even else Assignment.GradingMode.MANUAL
                        ),
                        allow_resubmission=is_even,
                        order=get_next_order(Assignment.objects.filter(module=module)),
                        created_by=instructor,
                    )
                assignments.append(assignment)
        return assignments

    def _create_quizzes(self, modules):
        # Same reasoning as _create_assignments: Quiz.order is uniquely constrained
        # per module, so compute the order at creation time instead of assuming 1.
        quizzes = []
        for module in modules:
            title = f"{module.title} - Quiz"
            quiz = Quiz.objects.filter(module=module, title=title).first()
            if quiz is None:
                quiz = Quiz.objects.create(
                    module=module,
                    title=title,
                    course=module.course,
                    description=f"Assessment quiz for {module.title}",
                    passing_score=40,
                    time_limit_minutes=15,
                    attempts_allowed=3,
                    status=Status.PUBLISHED,
                    order=get_next_order(Quiz.objects.filter(module=module)),
                )
            self._create_questions(quiz)
            quizzes.append(quiz)
        return quizzes

    def _create_questions(self, quiz):
        questions = []
        for order, template in enumerate(QUESTION_TEMPLATES, start=1):
            question, _ = Question.objects.get_or_create(
                quiz=quiz,
                text=template["text"],
                defaults={
                    "question_type": template["type"],
                    "marks": template["marks"],
                    "order": order,
                },
            )
            for choice_text, is_correct in template["choices"]:
                Choice.objects.get_or_create(
                    question=question,
                    text=choice_text,
                    defaults={"is_correct": is_correct},
                )
            questions.append(question)
        return questions

    def _create_enrollments(self, students, courses):
        enrollments = []
        for student in students:
            for course in courses:
                enrollment, _ = Enrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={"status": Enrollment.EnrollmentStatus.ACTIVE},
                )
                enrollments.append(enrollment)
        return enrollments
