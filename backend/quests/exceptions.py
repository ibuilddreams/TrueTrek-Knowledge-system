class QuestError(Exception):
    """Base for quest errors whose message is safe to show the student."""


class QuestAlreadyResolvedError(QuestError):
    """The assignment has already been completed or skipped."""


class QuestExpiredError(QuestError):
    """The assignment belongs to a past day and can no longer be actioned."""
