class RolePlayError(Exception):
    """Base for every wargamer failure whose message is safe to show the
    student verbatim — the views turn these straight into an error_response,
    the same arrangement quests/exceptions.py has."""


class ScenarioUnavailableError(RolePlayError):
    """The scenario exists but is not published (draft/archived), so a new
    session must not be started against it. An already-running session on a
    since-archived scenario is still allowed to finish."""


class SessionClosedError(RolePlayError):
    """The session has already been scored or abandoned — replying to it, or
    re-scoring it from scratch, would rewrite history."""


class TurnLimitReachedError(RolePlayError):
    """The athlete has used every turn in the scene. The only move left is to
    finish and be scored — this is a guard on AI spend as much as a
    pedagogical one (a real boundary conversation does not run for 40 turns)."""


class NotEnoughTurnsError(RolePlayError):
    """Too few athlete turns to score fairly. Evaluating a single "no" against
    a three-part rubric would produce a meaningless report card."""


class SimulatorUnavailableError(RolePlayError):
    """The AI provider could not produce a reply or a score. Separate from the
    errors above because nothing the student did caused it, and the message
    they see says so."""
