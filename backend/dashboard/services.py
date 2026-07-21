from django.db.models import Avg, Count, Q

from courses.models import Course, CourseInstructor
from enrollments.models import Enrollment
from progress.models import CourseProgress, LearningActivity
from quizzes.models import QuizResult
from users.models import CustomUser


def _serialize_activity(activity):
    return {
        "id": activity.id,
        "activity_type": activity.activity_type,
        "course_id": activity.course_id,
        "lesson_id": activity.lesson_id,
        "created_at": activity.created_at,
    }


def _serialize_course_progress(progress):
    return {
        "course_id": progress.course_id,
        "course_title": progress.course.title,
        "completion_percentage": progress.completion_percentage,
        "is_completed": progress.is_completed,
    }


def get_student_dashboard(user):
    enrollments = Enrollment.objects.filter(student=user)
    course_progress = CourseProgress.objects.filter(student=user).select_related("course")
    quiz_results = QuizResult.objects.filter(attempt__student=user)
    recent_activities = LearningActivity.objects.filter(student=user).order_by("-created_at")[:10]

    statistics = {
        "enrolled_courses": enrollments.count(),
        "completed_courses": course_progress.filter(is_completed=True).count(),
        "in_progress_courses": course_progress.filter(is_completed=False).count(),
        "average_progress": course_progress.aggregate(avg=Avg("completion_percentage"))["avg"] or 0,
        "quizzes_taken": quiz_results.count(),
        "quizzes_passed": quiz_results.filter(is_passed=True).count(),
    }

    activity_by_type = list(
        LearningActivity.objects.filter(student=user)
        .values("activity_type")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return {
        "statistics": statistics,
        "recent_activities": [_serialize_activity(activity) for activity in recent_activities],
        "progress_summary": [_serialize_course_progress(progress) for progress in course_progress],
        "charts": {
            "progress_by_course": [
                {"course": progress.course.title, "percentage": progress.completion_percentage}
                for progress in course_progress
            ],
            "activity_by_type": activity_by_type,
        },
    }


def get_teacher_dashboard(user):
    taught_course_ids = CourseInstructor.objects.filter(instructor=user).values_list(
        "course_id", flat=True
    )
    courses = Course.objects.filter(id__in=taught_course_ids)
    course_progress = CourseProgress.objects.filter(course_id__in=taught_course_ids).select_related("course")
    recent_activities = LearningActivity.objects.filter(course_id__in=taught_course_ids).order_by(
        "-created_at"
    )[:10]

    statistics = {
        "courses_taught": courses.count(),
        "total_students": Enrollment.objects.filter(course_id__in=taught_course_ids)
        .values("student_id")
        .distinct()
        .count(),
        "total_lessons": sum(course.modules.aggregate(count=Count("lessons"))["count"] or 0 for course in courses),
        "average_course_completion": course_progress.aggregate(avg=Avg("completion_percentage"))["avg"] or 0,
    }

    students_per_course = list(
        Enrollment.objects.filter(course_id__in=taught_course_ids)
        .values("course__title")
        .annotate(count=Count("student_id", distinct=True))
        .order_by("-count")
    )

    completion_by_course = list(
        course_progress.values("course__title").annotate(avg=Avg("completion_percentage")).order_by("-avg")
    )

    return {
        "statistics": statistics,
        "recent_activities": [_serialize_activity(activity) for activity in recent_activities],
        "progress_summary": [_serialize_course_progress(progress) for progress in course_progress],
        "charts": {
            "students_per_course": students_per_course,
            "completion_by_course": completion_by_course,
        },
    }


def get_admin_dashboard():
    statistics = {
        "total_users": CustomUser.objects.count(),
        "total_students": CustomUser.objects.filter(role=CustomUser.Roles.STUDENT).count(),
        "total_teachers": CustomUser.objects.filter(role=CustomUser.Roles.TEACHER).count(),
        "total_courses": Course.objects.count(),
        "total_enrollments": Enrollment.objects.count(),
        "average_course_completion": CourseProgress.objects.aggregate(avg=Avg("completion_percentage"))["avg"]
        or 0,
    }

    recent_activities = LearningActivity.objects.order_by("-created_at")[:10]

    users_by_role = list(CustomUser.objects.values("role").annotate(count=Count("id")).order_by("-count"))
    courses_by_status = list(Course.objects.values("status").annotate(count=Count("id")).order_by("-count"))
    enrollments_by_status = list(
        Enrollment.objects.values("status").annotate(count=Count("id")).order_by("-count")
    )

    return {
        "statistics": statistics,
        "recent_activities": [_serialize_activity(activity) for activity in recent_activities],
        "progress_summary": list(
            CourseProgress.objects.values("course__title")
            .annotate(avg=Avg("completion_percentage"))
            .order_by("-avg")
        ),
        "charts": {
            "users_by_role": users_by_role,
            "courses_by_status": courses_by_status,
            "enrollments_by_status": enrollments_by_status,
        },
    }


def get_dashboard_for_user(user):
    if user.is_admin:
        return get_admin_dashboard()
    if user.is_teacher:
        return get_teacher_dashboard(user)
    return get_student_dashboard(user)
