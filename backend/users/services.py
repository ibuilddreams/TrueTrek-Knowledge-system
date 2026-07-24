from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Count
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from courses.models import Course
from courses.serializers import CourseListSerializer
from enrollments.models import Enrollment
from enrollments.serializers import CourseEnrolledStudentSerializer
from progress.models import CourseProgress

from .serializers import StudentSerializer

UserModel = get_user_model()


def send_password_reset_email(email):
    user = UserModel.objects.filter(email__iexact=email).first()
    if user is None:
        return

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    send_mail(
        subject="Reset your TrueTrek Learning password",
        message=(
            "We received a request to reset your TrueTrek Learning password.\n\n"
            f"Reset your password using the link below:\n{reset_link}\n\n"
            "If you didn't request this, you can safely ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def get_teacher_assigned_courses(teacher):
    return (
        Course.objects.filter(instructors__instructor=teacher)
        .annotate(total_students=Count("enrollments", distinct=True))
        .select_related("category")
        .prefetch_related("tags", "instructors__instructor")
    )


def get_teacher_assigned_courses_with_students(teacher):
    courses = Course.objects.filter(instructors__instructor=teacher)

    courses_data = []
    for course in courses:
        enrollments = Enrollment.objects.filter(course=course).select_related("student")
        courses_data.append(
            {
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "status": course.status,
                "total_students": enrollments.count(),
                "students": CourseEnrolledStudentSerializer(enrollments, many=True).data,
            }
        )

    return courses_data


def get_teacher_enrolled_student_detail(teacher, student_id):
    enrollments = (
        Enrollment.objects.filter(student_id=student_id, course__instructors__instructor=teacher)
        .select_related("student", "course", "course__category")
        .prefetch_related("course__tags", "course__instructors__instructor")
    )

    if not enrollments.exists():
        return None

    student = enrollments[0].student
    course_ids = [enrollment.course_id for enrollment in enrollments]
    progress_by_course_id = {
        progress.course_id: progress
        for progress in CourseProgress.objects.filter(student_id=student_id, course_id__in=course_ids)
    }

    courses_data = []
    for enrollment in enrollments:
        progress = progress_by_course_id.get(enrollment.course_id)
        courses_data.append(
            {
                "course": CourseListSerializer(enrollment.course).data,
                "status": enrollment.status,
                "enrolled_at": enrollment.enrolled_at,
                "completion_percentage": progress.completion_percentage if progress else 0,
                "is_completed": progress.is_completed if progress else False,
            }
        )

    return {
        "student": StudentSerializer(student).data,
        "total_courses": len(courses_data),
        "courses": courses_data,
    }
