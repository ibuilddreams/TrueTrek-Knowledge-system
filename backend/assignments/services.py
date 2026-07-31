from django.db import transaction
from django.utils import timezone

from common.models import Status
from enrollments.models import Enrollment

from .models import Assignment, AssignmentSubmission, AssignmentSubmissionFile


class AssignmentPublishError(Exception):
    pass


class AssignmentSubmissionError(Exception):
    pass


class AssignmentGradingError(Exception):
    pass


class AssignmentReorderError(Exception):
    pass


def get_student_assignments(student):
    course_ids = list(
        Enrollment.objects.filter(student=student).values_list("course_id", flat=True)
    )
    assignments = list(
        Assignment.objects.filter(course_id__in=course_ids, status=Status.PUBLISHED)
        .select_related("course", "module")
        .order_by("due_date", "order")
    )
    assignment_ids = [assignment.id for assignment in assignments]
    submission_map = {
        row.assignment_id: row
        for row in AssignmentSubmission.objects.filter(
            student=student, assignment_id__in=assignment_ids
        )
    }

    now = timezone.now()
    results = []
    for assignment in assignments:
        submission = submission_map.get(assignment.id)
        is_overdue = now > assignment.due_date and (
            submission is None
            or submission.status
            in [
                AssignmentSubmission.SubmissionStatus.DRAFT,
            ]
        )
        results.append(
            {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date,
                "total_marks": assignment.total_marks,
                "allow_resubmission": assignment.allow_resubmission,
                "is_overdue": is_overdue,
                "course": {
                    "id": assignment.course_id,
                    "title": assignment.course.title if assignment.course_id else None,
                },
                "module": {
                    "id": assignment.module_id,
                    "title": assignment.module.title if assignment.module_id else None,
                }
                if assignment.module_id
                else None,
                "submission": {
                    "id": submission.id,
                    "status": submission.status,
                    "marks": submission.marks,
                    "feedback": submission.feedback,
                    "submitted_at": submission.submitted_at,
                    "graded_at": submission.graded_at,
                }
                if submission
                else None,
            }
        )
    return results


def publish_assignment(assignment):
    if assignment.status == Status.ARCHIVED:
        raise AssignmentPublishError("An archived assignment cannot be published.")
    if assignment.status == Status.PUBLISHED:
        return assignment

    if assignment.total_marks <= 0:
        raise AssignmentPublishError("Total marks must be greater than zero before publishing.")

    assignment.status = Status.PUBLISHED
    assignment.save(update_fields=["status"])
    return assignment


def submit_assignment(student, assignment, submission_text="", files=None):
    files = files or []

    if assignment.status != Status.PUBLISHED:
        raise AssignmentSubmissionError("This assignment is not currently published.")

    if not submission_text.strip() and not files:
        raise AssignmentSubmissionError("Provide submission text or at least one file.")

    now = timezone.now()
    is_late = now > assignment.due_date

    with transaction.atomic():
        submission, created = AssignmentSubmission.objects.get_or_create(
            assignment=assignment, student=student
        )

        if not created:
            if is_late and not assignment.allow_resubmission:
                raise AssignmentSubmissionError(
                    "The due date has passed and resubmission is not allowed for this assignment."
                )
            submission.status = AssignmentSubmission.SubmissionStatus.RESUBMITTED
            submission.marks = None
            submission.feedback = ""
            submission.graded_by = None
            submission.graded_at = None
        else:
            submission.status = (
                AssignmentSubmission.SubmissionStatus.LATE
                if is_late
                else AssignmentSubmission.SubmissionStatus.SUBMITTED
            )

        submission.submission_text = submission_text
        submission.submitted_at = now

        if assignment.grading_mode == Assignment.GradingMode.AUTO:
            submission.marks = assignment.total_marks
            submission.feedback = ""
            submission.status = AssignmentSubmission.SubmissionStatus.GRADED
            submission.graded_by = None
            submission.graded_at = now

        submission.save()

        for uploaded_file in files:
            AssignmentSubmissionFile.objects.create(submission=submission, file=uploaded_file)

    return submission


def grade_submission(submission, grader, marks, feedback=""):
    if marks < 0 or marks > submission.assignment.total_marks:
        raise AssignmentGradingError(
            f"Marks must be between 0 and {submission.assignment.total_marks}."
        )

    submission.marks = marks
    submission.feedback = feedback
    submission.status = AssignmentSubmission.SubmissionStatus.GRADED
    submission.graded_by = grader
    submission.graded_at = timezone.now()
    submission.save(update_fields=["marks", "feedback", "status", "graded_by", "graded_at"])

    return submission


def reorder_assignments(module_id, assignments_data):
    assignment_ids = [entry["assignment_id"] for entry in assignments_data]

    if len(assignment_ids) != len(set(assignment_ids)):
        raise AssignmentReorderError("Duplicate assignment ids are not allowed.")

    orders = [entry["order"] for entry in assignments_data]
    if len(orders) != len(set(orders)):
        raise AssignmentReorderError("Duplicate order values are not allowed.")

    existing_ids = set(Assignment.objects.filter(module_id=module_id).values_list("id", flat=True))
    if set(assignment_ids) != existing_ids:
        raise AssignmentReorderError(
            "Submitted assignment ids must exactly match the assignments belonging to this module."
        )

    # See quizzes.services.reorder_quizzes for why this is staged through a temporary
    # offset range: the (module, order) uniqueness is a non-deferrable partial unique
    # index, so writing final values directly can collide with another row mid-loop.
    temp_offset = max(orders) + 1
    with transaction.atomic():
        for index, entry in enumerate(assignments_data):
            Assignment.objects.filter(pk=entry["assignment_id"], module_id=module_id).update(
                order=temp_offset + index
            )
        for entry in assignments_data:
            Assignment.objects.filter(pk=entry["assignment_id"], module_id=module_id).update(
                order=entry["order"]
            )

    return (
        Assignment.objects.select_related("course", "module")
        .filter(module_id=module_id)
        .order_by("order")
    )
