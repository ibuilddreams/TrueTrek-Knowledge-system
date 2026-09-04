class NoReadableContentError(Exception):
    """None of the submission's files could be read for AI evaluation (only
    unsupported/corrupt file types were present). The service layer must
    never treat this as an empty submission passing or failing — it maps to
    a FAILED review with a clear, safe message, and the submission itself is
    left exactly as the student saved it."""


class AIReviewValidationError(Exception):
    """The AI's structured response could not be safely repaired into a
    valid grading result. Never silently treated as PASS — the review is
    marked FAILED instead, matching the ai_courses/daily_drill validator
    convention of rejecting rather than guessing on grade-determining
    fields."""


class AIReviewAlreadyProcessingError(Exception):
    """Another AI review attempt for this submission is already in flight —
    guards against duplicate/concurrent processing (double submit-click,
    browser retry, two tabs, etc.)."""
