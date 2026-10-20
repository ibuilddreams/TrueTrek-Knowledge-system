"""Tactical Wargamer — running and scoring a boundary role-play.

Both AI calls here are synchronous, on the fast `settings.AI_CHAT_MODEL`,
with the "don't retry a slow failure" heuristic `advisor/services.py` and
`daily_drill/ai_generation.py` share: a transport error that comes back
instantly is a blip worth one retry; one that ate the whole timeout means the
provider is slow right now, and retrying would only double the student's wait.

They are *not* backgrounded the way `ai_courses` and `brand_validator` are.
Those produce an artefact the student comes back to; this is a conversation
someone is typing into, so a thread-and-poll arrangement would add a polling
interval to every single line without removing any waiting.

Points are created in exactly one place (`evaluate_session`) and always
through `rewards.services.award_points`, so a role-play payout lands in the
same ledger and balance as a drill or a quest.
"""

import json
import logging
import time
from statistics import mean

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Avg, Count, Max, Q
from django.utils import timezone

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderQuotaError, ProviderTransportError
from common.models import Status
from rewards.models import PointsTransaction
from rewards.services import award_points

from .exceptions import (
    NotEnoughTurnsError,
    RolePlayError,
    ScenarioUnavailableError,
    SessionClosedError,
    SimulatorUnavailableError,
    TurnLimitReachedError,
)
from .models import RolePlayScenario, RolePlaySession, RolePlayTurn
from .prompts import (
    EVALUATION_SCHEMA,
    TURN_RESPONSE_SCHEMA,
    build_evaluation_prompt,
    build_turn_prompt,
)
from .validators import normalize_evaluation_payload, normalize_turn_payload

logger = logging.getLogger("wargamer")

Speaker = RolePlayTurn.Speaker
SessionStatus = RolePlaySession.SessionStatus

TRANSPORT_RETRY_BACKOFF_SECONDS = 1

# Messages shown to the student. Provider text is never surfaced — a Gemini
# error string in the middle of a role-play is both confusing and a leak.
_SIMULATOR_BUSY = "The simulator is busy right now. Give it a moment and send your reply again."
_SIMULATOR_UNREACHABLE = "We couldn't reach the simulator. Check your connection and try again."
_SIMULATOR_BROKEN = "The simulator couldn't continue that conversation. Try sending your reply again."
_SCORING_BUSY = "The scoring service is busy right now. Try again in a moment — your conversation is saved."
_SCORING_BROKEN = "We couldn't score that conversation. Try again — nothing you wrote has been lost."


def published_scenarios():
    """The catalog as students see it.

    Use this rather than `RolePlayScenario.objects` on any student-facing
    listing — a draft scenario is half-written copy and an archived one has
    been retired, but sessions already running against either are still
    allowed to finish (see `start_session`, which is the only gate).
    """
    return RolePlayScenario.objects.filter(status=Status.PUBLISHED)


# ---------------------------------------------------------------------------
# Provider plumbing
# ---------------------------------------------------------------------------


def _call_provider(prompt, schema, timeout, *, busy_message, broken_message, label):
    """One structured-output call, with a single retry for a fast transport
    failure. Returns the parsed payload; every failure path raises
    `SimulatorUnavailableError` with a message that is safe to show.

    `generate_course` is the provider interface's structured-output method —
    nothing about it is course-specific, and `brand_validator` reuses it the
    same way for its review payload.
    """
    provider = get_provider(model=settings.AI_CHAT_MODEL)
    slow_failure_threshold = timeout * 0.75
    start = time.monotonic()

    def _once():
        return provider.generate_course(prompt, schema, timeout=timeout)

    try:
        result = _once()
    except ProviderTransportError as exc:
        elapsed = time.monotonic() - start
        if elapsed >= slow_failure_threshold:
            logger.warning("%s timed out after %.1fs — not retrying (provider is slow).", label, elapsed)
            raise SimulatorUnavailableError(busy_message) from exc

        logger.warning("%s transport error after %.1fs — retrying once.", label, elapsed)
        time.sleep(TRANSPORT_RETRY_BACKOFF_SECONDS)
        try:
            result = _once()
        except (ProviderTransportError, ProviderError) as retry_exc:
            logger.error("%s failed after retry: %s", label, retry_exc)
            raise SimulatorUnavailableError(_SIMULATOR_UNREACHABLE) from retry_exc
    except ProviderQuotaError as exc:
        logger.error("%s hit the provider quota: %s", label, exc)
        raise SimulatorUnavailableError(busy_message) from exc
    except ProviderError as exc:
        logger.error("%s provider error: %s", label, exc)
        raise SimulatorUnavailableError(broken_message) from exc

    try:
        return json.loads(result.text)
    except (TypeError, ValueError) as exc:
        logger.error("%s returned non-JSON: %s", label, exc)
        raise SimulatorUnavailableError(broken_message) from exc


# ---------------------------------------------------------------------------
# Running a scene
# ---------------------------------------------------------------------------


def get_active_session(student, scenario):
    return RolePlaySession.objects.filter(
        student=student, scenario=scenario, status=SessionStatus.IN_PROGRESS
    ).first()


def start_session(student, scenario):
    """Opens a scene, or hands back the one already open.

    Resuming rather than restarting is what the partial unique constraint on
    (student, scenario) while IN_PROGRESS enforces: a student who closes the
    tab mid-argument and comes back should walk into the same conversation,
    and a student who double-taps "Start" should not fan out two of them.

    Costs no model call — the counterpart's opening line is authored on the
    scenario (`opening_message`), so the scene is on screen immediately.

    Returns `(session, created)`.
    """
    if scenario.status != Status.PUBLISHED:
        raise ScenarioUnavailableError("This scenario isn't available right now.")

    existing = get_active_session(student, scenario)
    if existing is not None:
        return existing, False

    now = timezone.now()
    try:
        with transaction.atomic():
            session = RolePlaySession.objects.create(
                student=student,
                scenario=scenario,
                persona=scenario.persona,
                status=SessionStatus.IN_PROGRESS,
                started_at=now,
                last_activity_at=now,
            )
            RolePlayTurn.objects.create(
                session=session,
                speaker=Speaker.COUNTERPART,
                content=scenario.opening_message,
                order=0,
                seconds_from_start=0,
            )
    except IntegrityError:
        # A concurrent request won the race; its session is the canonical one.
        session = get_active_session(student, scenario)
        if session is None:
            raise RolePlayError("Couldn't start that scenario. Please try again.") from None
        return session, False

    return session, True


def _turns_for(session):
    return list(session.turns.all())


def submit_turn(session, message):
    """Appends the athlete's line and the counterpart's answer to it.

    Both writes and the provider call live in one transaction on purpose. A
    failed call then leaves no half-finished exchange behind — the athlete's
    unanswered message is rolled back with it, and the frontend simply puts
    their text back in the composer. The alternative (write, call, compensate)
    needs a second cleanup path that only ever runs on the unhappy day.

    The unique constraint on (session, order) is the double-submit guard: two
    taps on Send race to claim the same slot and the loser is rejected rather
    than inserting a second athlete line into the middle of the scene.

    Returns `(athlete_turn, counterpart_turn)`.
    """
    if session.status != SessionStatus.IN_PROGRESS:
        raise SessionClosedError("This conversation is already finished.")
    if session.athlete_turn_count >= settings.ROLEPLAY_MAX_ATHLETE_TURNS:
        raise TurnLimitReachedError(
            "You've used every turn in this scene. Finish it and get your score."
        )

    now = timezone.now()
    seconds = max(0, int((now - session.started_at).total_seconds()))
    existing_turns = _turns_for(session)
    next_order = len(existing_turns)
    turns_remaining = settings.ROLEPLAY_MAX_ATHLETE_TURNS - (session.athlete_turn_count + 1)

    try:
        with transaction.atomic():
            athlete_turn = RolePlayTurn.objects.create(
                session=session,
                speaker=Speaker.ATHLETE,
                content=message,
                order=next_order,
                seconds_from_start=seconds,
            )

            prompt = build_turn_prompt(
                session.scenario, session.persona, existing_turns + [athlete_turn], turns_remaining
            )
            payload = _call_provider(
                prompt,
                TURN_RESPONSE_SCHEMA,
                settings.ROLEPLAY_TURN_TIMEOUT_SECONDS,
                busy_message=_SIMULATOR_BUSY,
                broken_message=_SIMULATOR_BROKEN,
                label=f"Role-play session {session.pk} turn",
            )

            try:
                fields = normalize_turn_payload(payload)
            except ValueError as exc:
                logger.error("Role-play session %s unusable turn payload: %s", session.pk, exc)
                raise SimulatorUnavailableError(_SIMULATOR_BROKEN) from exc

            counterpart_turn = RolePlayTurn.objects.create(
                session=session,
                speaker=Speaker.COUNTERPART,
                content=fields["content"],
                order=next_order + 1,
                seconds_from_start=max(0, int((timezone.now() - session.started_at).total_seconds())),
                pressure_level=fields["pressure_level"],
            )

            session.athlete_turn_count += 1
            session.last_activity_at = timezone.now()
            # Latches on: once the counterpart has backed down, a later line
            # is them wrapping up, not a fresh push.
            session.counterpart_conceded = session.counterpart_conceded or fields["conceded"]
            session.save(
                update_fields=[
                    "athlete_turn_count",
                    "last_activity_at",
                    "counterpart_conceded",
                    "updated_at",
                ]
            )
    except IntegrityError:
        raise RolePlayError(
            "Your last message is still being answered. Give it a second and try again."
        ) from None

    return athlete_turn, counterpart_turn


def abandon_session(session):
    """Walks away from a scene without scoring it.

    Kept distinct from simply leaving it IN_PROGRESS so the student's history
    shows a deliberate exit, and so the next visit to that scenario starts
    fresh rather than resuming an argument they chose to quit.
    """
    if session.status in (SessionStatus.COMPLETED, SessionStatus.ABANDONED):
        raise SessionClosedError("This conversation is already finished.")

    session.status = SessionStatus.ABANDONED
    session.completed_at = timezone.now()
    session.save(update_fields=["status", "completed_at", "updated_at"])
    return session


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------


def can_evaluate(session):
    """Whether there is enough of a conversation to grade. Drives the
    "Finish & Get Scored" button's enabled state as well as the server-side
    check, so the two can never disagree."""
    return (
        session.status in (SessionStatus.IN_PROGRESS, SessionStatus.EVALUATING)
        and session.athlete_turn_count >= settings.ROLEPLAY_MIN_ATHLETE_TURNS
    )


def _boundary_seconds(session, boundary_turn):
    """Wall-clock seconds from the scene opening to the athlete turn the
    grader identified as their first clear refusal. Read off the stored turn
    (measured server-side when it was written), never recomputed or supplied
    by the client."""
    if not boundary_turn:
        return None
    elapsed = list(
        session.turns.filter(speaker=Speaker.ATHLETE)
        .order_by("order")
        .values_list("seconds_from_start", flat=True)
    )
    if boundary_turn > len(elapsed):
        return None
    return elapsed[boundary_turn - 1]


def evaluate_session(session):
    """Closes the scene and writes the report card.

    Idempotent in the way that matters: an already-COMPLETED session is
    returned untouched rather than re-graded, and the payout is guarded three
    times over — a status re-check under `select_for_update`, an existence
    check on the ledger, and a partial unique index on
    `PointsTransaction.roleplay_session` that makes a second payment
    impossible even if the first two were somehow bypassed.

    A provider failure leaves the session in EVALUATING with `error_message`
    set, which is a retryable state: the transcript is intact and the student
    can ask for their score again.
    """
    if session.status == SessionStatus.COMPLETED:
        return session
    if session.status == SessionStatus.ABANDONED:
        raise SessionClosedError("You walked away from this conversation — start it again to be scored.")

    athlete_turn_count = session.turns.filter(speaker=Speaker.ATHLETE).count()
    if athlete_turn_count < settings.ROLEPLAY_MIN_ATHLETE_TURNS:
        raise NotEnoughTurnsError(
            f"Hold the conversation for at least {settings.ROLEPLAY_MIN_ATHLETE_TURNS} replies "
            "before asking for a score."
        )

    if session.status != SessionStatus.EVALUATING:
        session.status = SessionStatus.EVALUATING
        session.save(update_fields=["status", "updated_at"])

    prompt = build_evaluation_prompt(session.scenario, _turns_for(session))
    try:
        payload = _call_provider(
            prompt,
            EVALUATION_SCHEMA,
            settings.ROLEPLAY_EVALUATION_TIMEOUT_SECONDS,
            busy_message=_SCORING_BUSY,
            broken_message=_SCORING_BROKEN,
            label=f"Role-play session {session.pk} evaluation",
        )
    except SimulatorUnavailableError as exc:
        RolePlaySession.objects.filter(pk=session.pk).update(
            error_message=str(exc), updated_at=timezone.now()
        )
        raise

    try:
        fields = normalize_evaluation_payload(payload, athlete_turn_count)
    except ValueError as exc:
        logger.error("Role-play session %s unusable evaluation payload: %s", session.pk, exc)
        RolePlaySession.objects.filter(pk=session.pk).update(
            error_message=_SCORING_BROKEN, updated_at=timezone.now()
        )
        raise SimulatorUnavailableError(_SCORING_BROKEN) from exc

    overall = round(
        mean(
            (
                fields["time_to_boundary_score"],
                fields["tone_control_score"],
                fields["deflection_to_policy_score"],
            )
        )
    )
    passed = overall >= settings.ROLEPLAY_PASS_SCORE_PERCENT

    with transaction.atomic():
        locked = RolePlaySession.objects.select_for_update().select_related("scenario").get(pk=session.pk)
        if locked.status == SessionStatus.COMPLETED:
            # A concurrent request finished first — its report card stands.
            return locked

        for key, value in fields.items():
            setattr(locked, key, value)
        locked.overall_score = overall
        locked.passed = passed
        locked.boundary_seconds = _boundary_seconds(locked, fields["boundary_turn"])
        locked.status = SessionStatus.COMPLETED
        locked.completed_at = timezone.now()
        locked.provider = settings.AI_PROVIDER
        locked.model_name = settings.AI_CHAT_MODEL
        locked.error_message = ""

        points = locked.scenario.points_reward if passed else 0
        if points and not PointsTransaction.objects.filter(roleplay_session=locked).exists():
            try:
                award_points(
                    student=locked.student,
                    amount=points,
                    transaction_type=PointsTransaction.TransactionType.ROLEPLAY_REWARD,
                    reason=f"Role-Play: {locked.scenario.title}",
                    roleplay_session=locked,
                )
                locked.points_awarded = points
            except IntegrityError:
                # The unique index caught a payout this session already had.
                locked.points_awarded = locked.points_awarded or points

        locked.save()

    return locked


# ---------------------------------------------------------------------------
# Progress
# ---------------------------------------------------------------------------


def best_sessions_by_scenario(student):
    """The student's best completed run per scenario, keyed by scenario id.

    "Best" is the highest overall score, with the most recent run winning a
    tie — so re-running a scenario can improve the card on the scenario list
    but never downgrades it, which is what makes practising again safe.
    """
    best = {}
    completed = (
        RolePlaySession.objects.filter(student=student, status=SessionStatus.COMPLETED)
        .order_by("scenario_id", "-overall_score", "-completed_at")
        .select_related("scenario")
    )
    for session in completed:
        best.setdefault(session.scenario_id, session)
    return best


def get_module_stats(student):
    """The numbers above the scenario list.

    Everything is derived from the session rows, never stored, for the same
    reason quest streaks are: a stored counter and a visible list of runs can
    disagree, and the list is the one the student believes.
    """
    scenario_ids = list(published_scenarios().values_list("id", flat=True))
    total = len(scenario_ids)

    completed = RolePlaySession.objects.filter(
        student=student, status=SessionStatus.COMPLETED
    ).select_related("scenario")

    best = best_sessions_by_scenario(student)
    passed_ids = {
        scenario_id for scenario_id, session in best.items() if session.passed and scenario_id in scenario_ids
    }

    aggregates = completed.aggregate(
        avg_overall=Avg("overall_score"),
        avg_time=Avg("time_to_boundary_score"),
        avg_tone=Avg("tone_control_score"),
        avg_policy=Avg("deflection_to_policy_score"),
        best_overall=Max("overall_score"),
    )
    points_earned = sum(completed.values_list("points_awarded", flat=True))

    def _rounded(value):
        return round(value) if value is not None else None

    return {
        "scenarios_total": total,
        "scenarios_passed": len(passed_ids),
        "runs_completed": completed.count(),
        "best_overall_score": aggregates["best_overall"],
        "average_overall_score": _rounded(aggregates["avg_overall"]),
        "average_time_to_boundary": _rounded(aggregates["avg_time"]),
        "average_tone_control": _rounded(aggregates["avg_tone"]),
        "average_deflection_to_policy": _rounded(aggregates["avg_policy"]),
        "points_earned": points_earned,
        "pass_score_percent": settings.ROLEPLAY_PASS_SCORE_PERCENT,
        "max_athlete_turns": settings.ROLEPLAY_MAX_ATHLETE_TURNS,
        "min_athlete_turns": settings.ROLEPLAY_MIN_ATHLETE_TURNS,
        "time_to_boundary_target_seconds": settings.ROLEPLAY_TIME_TO_BOUNDARY_SECONDS,
        "module_complete": bool(total) and len(passed_ids) >= total,
    }


def get_admin_stats():
    """Catalog health for the admin screen — the same two questions the quests
    screen answers: is there enough material, and are students getting through
    it?"""
    sessions = RolePlaySession.objects.all()
    completed = sessions.filter(status=SessionStatus.COMPLETED)
    total_completed = completed.count()
    total_passed = completed.filter(passed=True).count()
    fabricated = completed.filter(used_fabricated_excuse=True).count()

    aggregates = completed.aggregate(
        avg_overall=Avg("overall_score"),
        avg_time=Avg("time_to_boundary_score"),
        avg_tone=Avg("tone_control_score"),
        avg_policy=Avg("deflection_to_policy_score"),
    )

    return {
        "published_scenarios": published_scenarios().count(),
        "draft_scenarios": RolePlayScenario.objects.filter(status=Status.DRAFT).count(),
        "archived_scenarios": RolePlayScenario.objects.filter(status=Status.ARCHIVED).count(),
        "total_sessions": sessions.count(),
        "sessions_in_progress": sessions.filter(
            status__in=(SessionStatus.IN_PROGRESS, SessionStatus.EVALUATING)
        ).count(),
        "sessions_abandoned": sessions.filter(status=SessionStatus.ABANDONED).count(),
        "sessions_completed": total_completed,
        "sessions_passed": total_passed,
        "pass_rate": round(total_passed / total_completed * 100) if total_completed else 0,
        "average_overall_score": round(aggregates["avg_overall"] or 0),
        "average_time_to_boundary": round(aggregates["avg_time"] or 0),
        "average_tone_control": round(aggregates["avg_tone"] or 0),
        "average_deflection_to_policy": round(aggregates["avg_policy"] or 0),
        # How often the grader caught an invented authority — the one coaching
        # signal that says the module's core lesson is not landing.
        "fabricated_excuse_rate": round(fabricated / total_completed * 100) if total_completed else 0,
        "active_students": sessions.values("student").distinct().count(),
    }


def scenario_usage_counts():
    """Per-scenario session/pass counts, annotated for the admin catalog list."""
    return RolePlayScenario.objects.annotate(
        session_count=Count("sessions", distinct=True),
        completion_count=Count(
            "sessions",
            filter=Q(sessions__status=SessionStatus.COMPLETED),
            distinct=True,
        ),
    )
