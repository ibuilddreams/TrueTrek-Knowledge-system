"""Repair and validation of provider responses.

Same rule as `ai_courses/validators.py` and `brand_validator/validators.py`: a
provider response is never written to the database as it arrives. A grader that
returns a score of 140, a strengths list as a bare string, or a boundary turn
that does not exist in the transcript has to degrade into a usable report card
rather than a 500 or a corrupt row.

These helpers are deliberately local to this app rather than imported from
`brand_validator` — its payload shape is its own, and the two sets of rules
drift independently. That is the same choice brand_validator made with respect
to ai_courses.
"""

MIN_SCORE = 0
MAX_SCORE = 100
MAX_PRESSURE_LEVEL = 5


def _clean_text(value, limit=2000):
    if not isinstance(value, str):
        return ""
    return value.strip()[:limit]


def _clamp_score(value):
    try:
        score = int(value)
    except (TypeError, ValueError):
        # A missing or unparseable criterion is scored 0 rather than dropped:
        # the overall score is an average of all three, and silently averaging
        # over two would flatter a run the grader could not actually read.
        return MIN_SCORE
    return max(MIN_SCORE, min(MAX_SCORE, score))


def _clean_entries(value, limit=3):
    """Normalises a findings list into [{title, detail}].

    Tolerates the two shapes a model produces when it drifts off schema — a
    list of bare strings, and a dict with the real list nested one level down.
    """
    if isinstance(value, dict):
        value = next((item for item in value.values() if isinstance(item, list)), [])
    if not isinstance(value, list):
        return []

    entries = []
    for item in value:
        if isinstance(item, str):
            title, detail = _clean_text(item, 200), ""
        elif isinstance(item, dict):
            title = _clean_text(item.get("title"), 200)
            detail = _clean_text(item.get("detail"))
        else:
            continue

        if not title and not detail:
            continue
        entries.append({"title": title or "Note", "detail": detail or title})
        if len(entries) >= limit:
            break

    return entries


def normalize_turn_payload(payload):
    """Turns a raw counterpart-turn payload into the fields RolePlayTurn stores.

    Raises ValueError only when there is no usable line of dialogue at all —
    everything else is repaired, because the student is mid-conversation and a
    missing `pressure_level` is not a reason to break the scene.
    """
    if not isinstance(payload, dict):
        raise ValueError("The simulator returned an unexpected response.")

    reply = _clean_text(payload.get("reply"), 1200)
    if not reply:
        raise ValueError("The simulator returned an empty reply.")

    try:
        pressure = int(payload.get("pressure_level"))
    except (TypeError, ValueError):
        pressure = 3
    pressure = max(1, min(MAX_PRESSURE_LEVEL, pressure))

    conceded = payload.get("conceded")
    if not isinstance(conceded, bool):
        # Absent means the model did not say it was backing down. Treating that
        # as a concession would end scenes early and hand the student an easy
        # win they did not earn.
        conceded = False

    return {"content": reply, "pressure_level": pressure, "conceded": conceded}


def normalize_evaluation_payload(payload, athlete_turn_count):
    """Turns a raw evaluation payload into exactly the fields RolePlaySession
    stores — minus `overall_score`, which services.evaluate_session computes
    from the three criteria so the model never sets its own headline number.

    `athlete_turn_count` bounds `boundary_turn`: a grader that reports turn 7 of
    a 3-turn conversation is wrong about something, and an out-of-range index
    would render as a highlight on a message that does not exist.

    Returns a dict of model fields, ready to `setattr` onto the session.
    """
    if not isinstance(payload, dict):
        raise ValueError("The scoring service returned an unexpected response.")

    scores = {
        "time_to_boundary_score": _clamp_score(payload.get("time_to_boundary_score")),
        "tone_control_score": _clamp_score(payload.get("tone_control_score")),
        "deflection_to_policy_score": _clamp_score(payload.get("deflection_to_policy_score")),
    }

    try:
        boundary_turn = int(payload.get("boundary_turn"))
    except (TypeError, ValueError):
        boundary_turn = 0
    # 0 is the schema's "they never clearly refused", which is meaningful and
    # kept as None rather than coerced to turn 1.
    boundary_turn = boundary_turn if 1 <= boundary_turn <= athlete_turn_count else None

    used_fabricated_excuse = payload.get("used_fabricated_excuse")
    if not isinstance(used_fabricated_excuse, bool):
        used_fabricated_excuse = False

    note = _clean_text(payload.get("fabrication_note"), 600) if used_fabricated_excuse else ""

    # The grader's evidence for each score, stored together in one JSON column
    # (see RolePlaySession.criteria_notes) — nothing queries into them.
    criteria_notes = {
        "time_to_boundary": _clean_text(payload.get("time_to_boundary_note"), 600),
        "tone_control": _clean_text(payload.get("tone_control_note"), 600),
        "deflection_to_policy": _clean_text(payload.get("deflection_to_policy_note"), 600),
    }

    return {
        **scores,
        "criteria_notes": criteria_notes,
        "boundary_turn": boundary_turn,
        "verdict": _clean_text(payload.get("verdict"), 255) or "Scored",
        "summary": _clean_text(payload.get("summary")),
        "strengths": _clean_entries(payload.get("strengths"), limit=3),
        "improvements": _clean_entries(payload.get("improvements"), limit=4),
        "suggested_response": _clean_text(payload.get("suggested_response"), 1500),
        "used_fabricated_excuse": used_fabricated_excuse,
        "fabrication_note": note,
    }
