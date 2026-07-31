from django.db.models import Avg, Count, Q
from django.utils import timezone

from assignments.models import Assignment, AssignmentSubmission
from common.models import Status
from courses.models import Course, CourseInstructor
from enrollments.models import Enrollment
from lessons.models import Lesson
from progress.models import CourseProgress, LearningActivity
from quizzes.models import Quiz, QuizAnswer, QuizResult
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
    course_ids = list(enrollments.values_list("course_id", flat=True))
    course_progress = CourseProgress.objects.filter(student=user).select_related("course")
    quiz_results = QuizResult.objects.filter(attempt__student=user)
    recent_activities = LearningActivity.objects.filter(student=user).order_by("-created_at")[:10]

    enrolled_courses = enrollments.count()
    active_courses = enrollments.filter(status=Enrollment.EnrollmentStatus.ACTIVE).count()
    completed_courses = course_progress.filter(is_completed=True).count()
    average_progress = course_progress.aggregate(avg=Avg("completion_percentage"))["avg"] or 0

    published_assignments = Assignment.objects.filter(
        course_id__in=course_ids,
        status=Status.PUBLISHED,
    )
    submitted_assignment_ids = AssignmentSubmission.objects.filter(
        student=user,
        assignment_id__in=published_assignments.values_list("id", flat=True),
        status__in=[
            AssignmentSubmission.SubmissionStatus.SUBMITTED,
            AssignmentSubmission.SubmissionStatus.LATE,
            AssignmentSubmission.SubmissionStatus.GRADED,
            AssignmentSubmission.SubmissionStatus.RESUBMITTED,
        ],
    ).values_list("assignment_id", flat=True)
    pending_assignments = published_assignments.exclude(
        id__in=submitted_assignment_ids
    ).count()

    now = timezone.now()
    published_quizzes = Quiz.objects.filter(
        course_id__in=course_ids,
        status=Status.PUBLISHED,
    ).filter(Q(available_until__isnull=True) | Q(available_until__gte=now))
    passed_quiz_ids = QuizResult.objects.filter(
        attempt__student=user,
        is_passed=True,
        attempt__quiz_id__in=published_quizzes.values_list("id", flat=True),
    ).values_list("attempt__quiz_id", flat=True)
    upcoming_quizzes = published_quizzes.exclude(id__in=passed_quiz_ids).count()

    average_grade = quiz_results.aggregate(avg=Avg("percentage"))["avg"] or 0

    statistics = {
        "enrolled_courses": enrolled_courses,
        "active_courses": active_courses,
        "completed_courses": completed_courses,
        "overall_progress": round(float(average_progress), 2),
        "pending_assignments": pending_assignments,
        "upcoming_quizzes": upcoming_quizzes,
        "certificates": completed_courses,
        "average_grade": round(float(average_grade), 2),
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
                {
                    "course": progress.course.title,
                    "percentage": round(float(progress.completion_percentage), 2),
                }
                for progress in course_progress
            ],
            "activity_by_type": activity_by_type,
        },
    }


def get_teacher_dashboard(user):
    taught_course_ids = list(
        CourseInstructor.objects.filter(instructor=user).values_list("course_id", flat=True)
    )
    courses = Course.objects.filter(id__in=taught_course_ids)
    course_progress = CourseProgress.objects.filter(course_id__in=taught_course_ids).select_related(
        "course"
    )
    recent_activities = LearningActivity.objects.filter(course_id__in=taught_course_ids).order_by(
        "-created_at"
    )[:10]

    published_lessons = Lesson.objects.filter(module__course_id__in=taught_course_ids).count()
    total_quizzes = Quiz.objects.filter(course_id__in=taught_course_ids).count()

    pending_assignment_submissions = AssignmentSubmission.objects.filter(
        assignment__course_id__in=taught_course_ids,
        status__in=[
            AssignmentSubmission.SubmissionStatus.SUBMITTED,
            AssignmentSubmission.SubmissionStatus.LATE,
            AssignmentSubmission.SubmissionStatus.RESUBMITTED,
        ],
    ).count()
    pending_quiz_answers = QuizAnswer.objects.filter(
        attempt__quiz__course_id__in=taught_course_ids,
        grading_status=QuizAnswer.GradingStatus.PENDING_GRADING,
    ).count()

    average_student_progress = (
        course_progress.aggregate(avg=Avg("completion_percentage"))["avg"] or 0
    )

    statistics = {
        "my_courses": courses.count(),
        "enrolled_students": Enrollment.objects.filter(course_id__in=taught_course_ids)
        .values("student_id")
        .distinct()
        .count(),
        "published_lessons": published_lessons,
        "pending_grading": pending_assignment_submissions + pending_quiz_answers,
        "total_quizzes": total_quizzes,
        "average_student_progress": round(float(average_student_progress), 2),
    }

    students_per_course = list(
        Enrollment.objects.filter(course_id__in=taught_course_ids)
        .values("course__title")
        .annotate(count=Count("student_id", distinct=True))
        .order_by("-count")
    )

    completion_by_course = list(
        course_progress.values("course__title")
        .annotate(avg=Avg("completion_percentage"))
        .order_by("-avg")
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
