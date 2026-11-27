"""Reward points for scoring well on a quiz.

The fourth way a student earns points, beside the daily drill, daily quests
and the role-play simulator — and like those three it owns its own rule and
pays through `rewards.services.award_points`, so a quiz payout lands in the
same ledger and the same balance as everything else rather than in a counter
of its own.

Two rules, and the second is what keeps the first honest:

**A band pays on the percentage scored.** `SCORE_REWARD_BANDS` is the whole
table; adding a band is one line, and a score matching none pays nothing and
writes no ledger row at all.

**Only the first two attempts can earn.** Attempts on this platform are
unlimited and every retry after the first is a *freshly generated* question
set (`quizzes/ai_generation.py`), so without this a student could simply
re-sit a quiz until they happened to ace one and collect the top band for it.
Two tries is the brief's own number and it is the right shape: it pays
somebody who got it nearly right and came back, and it stops paying long
before persistence beats knowing the material.

Points are awarded from `services._recompute_quiz_result`, which means the
award is reached **every time an attempt is re-scored**, not once — a
short-answer question graded by a teacher days later re-runs it. So this
module is written to be re-entered: it checks for an existing payout under a
row lock and returns None, and `PointsTransaction`'s partial unique
constraint on `quiz_attempt` is the database's own answer if two graders ever
pass that check at the same moment. A payout is never reversed when a later
re-grade lowers a score — the ledger is append-only, and undoing one is a
manual adjustment in `rewards`, exactly as it is for a quest.
"""

import logging

from django.db import IntegrityError, transaction

from rewards.models import PointsTransaction
from rewards.services import award_points

from .models import QuizAttempt

logger = logging.getLogger("quizzes.points")

# Score bands, as percentages of the attempt's total marks. Checked in order
# and the first match wins, so overlapping bands resolve top-down rather than
# silently paying twice. `maximum` is inclusive.
SCORE_REWARD_BANDS = (
    {"minimum": 96, "maximum": 100, "points": 100},
)

# The last attempt number that can still earn (see the module docstring).
MAX_REWARDED_ATTEMPT_NUMBER = 2


def points_for_percentage(percentage):
    """The points a given score is worth, or 0 if it falls in no band."""
    if percentage is None:
        return 0
    try:
        score = float(percentage)
    except (TypeError, ValueError):
        return 0
    for band in SCORE_REWARD_BANDS:
        if band["minimum"] <= score <= band["maximum"]:
            return band["points"]
    return 0


def describe_reward_bands():
    """The earning rule in a shape the API can hand to the portal, so the
    student is told what a quiz is worth from the same table that pays it
    rather than from copy that drifts out of step with it."""
    return {
        "max_rewarded_attempt_number": MAX_REWARDED_ATTEMPT_NUMBER,
        "bands": [
            {
                "min_percentage": band["minimum"],
                "max_percentage": band["maximum"],
                "points": band["points"],
            }
            for band in SCORE_REWARD_BANDS
        ],
    }


def maybe_award_quiz_score_points(attempt, result):
    """Pays this attempt's score band if it has earned one and has not been
    paid already. Returns the PointsTransaction, or None — including for
    every ordinary "nothing to pay here" case, which is most calls.

    Never raises. See the broad `except` at the bottom for why that matters.

    """
    # Only a finished, properly graded attempt earns. An attempt still
    # SUBMITTED has short answers nobody has scored yet, so its percentage is
    # not its score; EXPIRED and ABANDONED describe an attempt the student
    # walked away from, and `_recompute_quiz_result` deliberately leaves both
    # at that status however the marks later move.
    if attempt.status != QuizAttempt.AttemptStatus.GRADED:
        return None
    if attempt.attempt_number > MAX_REWARDED_ATTEMPT_NUMBER:
        return None

    points = points_for_percentage(result.percentage)
    if not points:
        return None

    try:
        with transaction.atomic():
            # Locking the attempt (not the points account — award_points does
            # that) is what serializes two graders finishing the last two
            # pending answers of one attempt at the same instant.
            locked = QuizAttempt.objects.select_for_update().get(pk=attempt.pk)
            if PointsTransaction.objects.filter(quiz_attempt_id=locked.pk).exists():
                return None

            return award_points(
                student=locked.student,
                amount=points,
                transaction_type=PointsTransaction.TransactionType.QUIZ_REWARD,
                reason=f"Quiz score: {attempt.quiz.title}",
                quiz_attempt=locked,
            )
    except IntegrityError:
        # The unique constraint caught a payout this process didn't see. The
        # `atomic()` above is a savepoint, so rolling it back leaves the
        # grading transaction that called us intact.
        logger.warning(
            "Quiz score points for attempt %s were already awarded elsewhere.", attempt.pk
        )
        return None
    except Exception:
        # Deliberately broad, and the reason this function promises never to
        # raise. Its caller is `_recompute_quiz_result`, which every path that
        # settles an attempt's marks runs through — a student submitting and a
        # teacher grading a short answer alike. Points are a reward layer on
        # top of that; a rewards outage must never be what makes a student's
        # marks or a teacher's grading fail. Logged with the traceback, because
        # silently paying nobody is the other way this could go wrong.
        logger.exception("Quiz score points could not be awarded for attempt %s.", attempt.pk)
        return None
