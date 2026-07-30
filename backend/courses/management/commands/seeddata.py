from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment
from lessons.models import Lesson
from modules.models import Module

User = get_user_model()

DEFAULT_PASSWORD = "Password@123"

ADMIN_DATA = {
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
}

TEACHER_DATA = [
    {"email": f"teacher{i}@example.com", "first_name": "Teacher", "last_name": str(i)}
    for i in range(1, 4)
]

STUDENT_DATA = [
    {"email": f"student{i}@example.com", "first_name": "Student", "last_name": str(i)}
    for i in range(1, 4)
]

COURSE_COUNT = 5
MODULES_PER_COURSE = 5
LESSONS_PER_MODULE = 5


class Command(BaseCommand):
    help = "Seeds the database with demo users, courses, modules, lessons and enrollments"

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

            modules = self._create_modules(courses)
            self.stdout.write(self.style.SUCCESS(f"Created {len(modules)} modules"))

            lessons = self._create_lessons(modules)
            self.stdout.write(self.style.SUCCESS(f"Created {len(lessons)} lessons"))

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
                    "description": f"Demo course {i}",
                    "category": category,
                    "status": Status.PUBLISHED,
                },
            )
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
                lesson, _ = Lesson.objects.get_or_create(
                    module=module,
                    title=f"{module.title} - Lesson {order}",
                    defaults={
                        "description": f"Lesson {order} of {module.title}",
                        "content_type": Lesson.ContentType.TEXT,
                        "content_data": f"Content for lesson {order}",
                        "order": order,
                    },
                )
                lessons.append(lesson)
        return lessons

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
