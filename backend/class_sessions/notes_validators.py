"""Never trust a provider response directly — the same rule as
`ai_courses/validators.py` and `brand_validator/validators.py`.

A structured-output schema is a request, not a guarantee: a model under
length pressure drops a required field, answers a list of objects with a list
of strings, or returns the whole document wrapped in one more layer. None of
that is worth failing a class's notes over when the content is plainly there,
so everything that can be repaired is repaired here and everything that
cannot is dropped — and what reaches the database always has the shape the
model, the PDF renderer and the frontend all assume.

The one thing never repaired is **emptiness**. If there is no summary, the
notes failed; writing a blank document and telling thirty students it is
ready would be worse than saying nothing.
"""

# Generous but finite. A model that loops can emit the same bullet a thousand
# times, and a document is not improved by printing all of them.
MAX_TOPICS = 20
MAX_POINTS = 40
MAX_ACTIONS = 25

MAX_TITLE_CHARS = 200
MAX_LINE_CHARS = 600
MAX_SUMMARY_CHARS = 4000

DEFAULT_OWNER = "All students"


def _text(value, limit=MAX_LINE_CHARS):
    if value is None or isinstance(value, (dict, list, tuple, set, bool)):
        return ""
    return " ".join(str(value).split())[:limit].strip()


def _string_list(value):
    """A list of short strings, however the model expressed it.

    Tolerates a bare string (split on newlines, which is how a model that
    ignored the array type usually answers) and a list of one-key objects.
    """
    if value is None:
        return []
    if isinstance(value, str):
        value = [part for part in value.splitlines()]
    if not isinstance(value, (list, tuple)):
        return []

    items = []
    for entry in value:
        if isinstance(entry, dict):
            # `[{"topic": "..."}]` instead of `["..."]`.
            entry = next((v for v in entry.values() if isinstance(v, str)), "")
        text = _text(entry)
        if text and text not in items:
            items.append(text)
    return items


def _objects(value, *, fields, required):
    """A list of objects with known keys, repairing the common near-misses.

    A bare string becomes an object with the required field filled and the
    rest empty — a model that answered `["Read chapter 4"]` for action items
    meant exactly that, and refusing it would throw away real homework.
    """
    if value is None:
        return []
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, (list, tuple)):
        return []

    rows = []
    for entry in value:
        if isinstance(entry, str):
            entry = {required: entry}
        if not isinstance(entry, dict):
            continue

        row = {field: _text(entry.get(field), MAX_LINE_CHARS) for field in fields}
        if not row.get(required):
            continue
        rows.append(row)
    return rows


def _unwrap(payload):
    """A model that nested the whole answer under one key.

    Seen in practice as `{"notes": {...}}` or `{"meeting_notes": {...}}`.
    Only unwrapped when the inner object actually looks like the answer, so a
    legitimate single-key response is never mistaken for a wrapper.
    """
    if not isinstance(payload, dict):
        return {}
    if "summary" in payload or "has_content" in payload:
        return payload
    if len(payload) == 1:
        inner = next(iter(payload.values()))
        if isinstance(inner, dict):
            return _unwrap(inner)
    return payload


def normalize_notes_payload(payload, *, fallback_title=""):
    """The provider's answer as the row this app stores.

    Returns `{"has_content", "title", "summary", "key_topics",
    "important_points", "action_items", "next_class"}` with every field
    present and of the right type, whatever arrived.

    `has_content` is only believed when it is an explicit `False`: a model
    that omitted the field wrote notes, and hiding a real write-up behind the
    "nothing was taught" screen because a boolean went missing is the failure
    that costs a class its lesson. The reverse mistake is cheap — a nearly
    empty document that says so.
    """
    data = _unwrap(payload)

    summary = _text(data.get("summary"), MAX_SUMMARY_CHARS)
    title = _text(data.get("title") or data.get("meeting_title"), MAX_TITLE_CHARS)

    topics = _string_list(data.get("key_topics") or data.get("topics"))[:MAX_TOPICS]

    points = _objects(
        data.get("important_points") or data.get("key_points"),
        fields=("point", "detail"),
        required="point",
    )[:MAX_POINTS]

    actions = _objects(
        data.get("action_items") or data.get("actions"),
        fields=("task", "owner", "due"),
        required="task",
    )[:MAX_ACTIONS]
    for action in actions:
        if not action["owner"]:
            action["owner"] = DEFAULT_OWNER

    has_content = data.get("has_content")
    has_content = False if has_content is False else True

    return {
        "has_content": bool(has_content and summary),
        "title": title or _text(fallback_title, MAX_TITLE_CHARS),
        "summary": summary,
        "key_topics": topics,
        "important_points": points,
        "action_items": actions,
        "next_class": _text(data.get("next_class") or data.get("next_session")),
    }
