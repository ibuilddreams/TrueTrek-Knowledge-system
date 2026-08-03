from django.db.models import Avg

from assignments.models import Assignment, AssignmentSubmission
from common.models import Status
from enrollments.models import Enrollment
from lessons.models import Lesson
from progress.models import LessonProgress
from quizzes.models import QuizResult

from .models import CourseInstructor


def is_course_instructor(user, course):
    return CourseInstructor.objects.filter(course=course, instructor=user).exists()


def _build_student_detail(course, enrollment, total_lessons, include_course_id):
    student = enrollment.student

    lessons_completed = LessonProgress.objects.filter(
        student=student, lesson__module__course=course, is_completed=True
    ).count()

    quiz_results = QuizResult.objects.filter(attempt__student=student, attempt__quiz__course=course)
    quizzes_attempted = quiz_results.count()
    average_percentage = quiz_results.aggregate(avg=Avg("percentage"))["avg"] or 0

    total_assignments = Assignment.objects.filter(course=course, status=Status.PUBLISHED).count()
    submitted_assignments = AssignmentSubmission.objects.filter(
        student=student,
        assignment__course=course,
        status__in=[
            AssignmentSubmission.SubmissionStatus.SUBMITTED,
            AssignmentSubmission.SubmissionStatus.LATE,
            AssignmentSubmission.SubmissionStatus.GRADED,
            AssignmentSubmission.SubmissionStatus.RETURNED,
            AssignmentSubmission.SubmissionStatus.RESUBMITTED,
        ],
    ).count()

    data = {
        "student_id": student.id,
        "name": student.name,
        "enrolled_at": enrollment.enrolled_at,
        "status": enrollment.status,
        "progress": {
            "lessons_completed": lessons_completed,
            "total_lessons": total_lessons,
            "completion_percentage": (
                round((lessons_completed / total_lessons) * 100, 2) if total_lessons else 0
            ),
        },
        "quiz_performance": {
            "quizzes_attempted": quizzes_attempted,
            "average_percentage": round(float(average_percentage), 2),
        },
        "assignments": {
            "submitted": submitted_assignments,
            "total": total_assignments,
        },
    }

    if include_course_id:
        data["course_id"] = course.id

    return data


def get_course_students_detail(course, teacher=None):
    enrollments = Enrollment.objects.filter(course=course).select_related("student")
    if teacher is not None:
        enrollments = enrollments.filter(teacher=teacher)
    total_lessons = Lesson.objects.filter(module__course=course).count()

    return [
        _build_student_detail(course, enrollment, total_lessons, include_course_id=False)
        for enrollment in enrollments
    ]
