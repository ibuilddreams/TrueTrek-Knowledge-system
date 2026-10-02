from django.contrib.auth import get_user_model
from django.db.models import Avg, Count

from common.models import Status
from courses.models import Course, CourseInstructor
from enrollments.models import Enrollment

from .models import InstructorFeedback

UserModel = get_user_model()


def get_public_instructor(user_id):
    """The teacher with this id, but only if they actually teach a published
    course — so the public page can't be used to enumerate every teacher."""
    return (
        UserModel.objects.filter(
            pk=user_id,
            role=UserModel.Roles.TEACHER,
            account_status=UserModel.AccountStatus.ACTIVE,
            taught_courses__course__status=Status.PUBLISHED,
        )
        .select_related("profile", "instructor_profile")
        .distinct()
        .first()
    )


def published_courses_for(instructor):
    return Course.objects.filter(
        status=Status.PUBLISHED, instructors__instructor=instructor
    ).distinct()


def instructor_stats(instructor):
    courses = published_courses_for(instructor)
    students = (
        Enrollment.objects.filter(course__in=courses)
        .exclude(status=Enrollment.EnrollmentStatus.CANCELLED)
        .values("student")
        .distinct()
        .count()
    )
    feedback = InstructorFeedback.objects.filter(instructor=instructor).aggregate(
        reviews=Count("id"), rating=Avg("rating")
    )
    return {
        "students": students,
        "courses": courses.count(),
        "reviews": feedback["reviews"] or 0,
        "rating": round(feedback["rating"], 1) if feedback["rating"] is not None else None,
    }


def eligible_courses(student, instructor):
    """Courses taught by `instructor` that `student` is (or was) enrolled in."""
    taught_ids = CourseInstructor.objects.filter(instructor=instructor).values("course_id")
    enrolled_ids = (
        Enrollment.objects.filter(student=student)
        .exclude(status=Enrollment.EnrollmentStatus.CANCELLED)
        .values("course_id")
    )
    return Course.objects.filter(id__in=taught_ids).filter(id__in=enrolled_ids)
