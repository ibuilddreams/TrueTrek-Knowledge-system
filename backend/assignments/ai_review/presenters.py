"""Plain-dict, student-safe presentation of an AssignmentAIReview — shared by
`assignments.services.get_student_assignments`'s dict-based list and
`AssignmentSubmissionSerializer.get_ai_review`, so the shape is defined
exactly once. Deliberately kept separate from `ai_review/services.py` (which
imports `assignments.services` for `grade_submission`) — importing it from
`assignments.services` would otherwise create a circular import.

Never includes `error_message`, `provider`, or `model_name` — those are
internal/debugging-only fields, not shown to students or in this shared
summary.
"""


def latest_review_summary(submission):
    # AssignmentAIReview.Meta.ordering is already ("submission", "-attempt_number"),
    # so plain .first() returns the latest attempt — and, crucially, hits a
    # prefetch_related("ai_reviews") cache when the caller supplied one,
    # unlike an explicit .order_by(...) chain, which always re-queries.
    review = submission.ai_reviews.first()
    if review is None:
        return None
    return {
        "id": review.id,
        "attempt_number": review.attempt_number,
        "status": review.status,
        "score": review.score,
        "feedback": review.feedback,
        "criteria_results": review.criteria_results,
        "strengths": review.strengths,
        "improvements": review.improvements,
        "updated_at": review.updated_at,
    }
