class InsufficientPointsError(Exception):
    """Raised when a spend (redemption or negative adjustment) would take a
    student's balance below zero."""


class RewardNotAvailableError(Exception):
    """Raised when a student tries to redeem a reward that isn't ACTIVE."""


class RedemptionStateError(Exception):
    """Raised when a redemption status transition isn't allowed from its
    current state (e.g. approving an already-completed redemption)."""


class FulfillmentError(Exception):
    """Raised when scheduling/rescheduling a redemption's fulfillment isn't
    allowed — wrong redemption state, or invalid scheduling data."""
