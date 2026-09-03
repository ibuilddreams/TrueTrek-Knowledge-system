class DrillAlreadyAttemptedError(Exception):
    """Today's drill (whichever source produced it) has already been
    completed by this student — the operation is not retried/duplicated."""


class InvalidDrillOptionError(Exception):
    """The submitted answer key does not belong to today's resolved drill."""


class DrillUnavailableError(Exception):
    """No admin-scheduled drill, AI generation, or legacy fallback question
    could be resolved for today — there is genuinely nothing to show."""


class DrillGenerationError(Exception):
    """AI generation failed (provider error, or validation found nothing
    usable) — callers must fall back rather than propagate this to the
    student as a raw error."""


class ScheduleValidationError(Exception):
    """An admin's Daily Drill schedule create/update request violates a
    business rule (e.g. a past scheduled_date, or editing an already-passed
    schedule)."""


class VideoProgressError(Exception):
    """Video progress was reported against a drill that isn't today's
    admin-scheduled drill, or is otherwise invalid."""


class QuizSubmissionError(Exception):
    """The submitted admin-drill quiz answers could not be graded (wrong
    schedule, quiz already passed, malformed answers)."""
