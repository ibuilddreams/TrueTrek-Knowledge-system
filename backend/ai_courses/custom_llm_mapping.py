"""Field mapping between this LMS and the self-hosted course-generation service.

Two directions, both pure (no ORM writes, no network) so they are testable with
hand-written payloads:

* `build_request_payload` — the admin wizard's validated form -> the service's
  POST /api/v1/generate/admin/course body.
* `adapt_job_result` — the finished GET /api/v1/jobs/<id> body -> the same plan
  shape Gemini's structured output produced.

The second one exists so that `ai_courses/validators.py` and
`ai_courses/writer.py` keep working untouched: everything downstream of this
file still sees `{"summary", "objectives", "learning_outcomes", "modules": [
{"title", "description", "items": [{"kind": "lesson"|"quiz"|"assignment", ...}]}]}`.
All the capping, repairing and warning stays where it already is, and the
service can change shape without the writer ever hearing about it.

The readers here accept several spellings per field on purpose. The service owns
its own schema and this integration cannot pin it; a module called `chapters`, a
choice list called `options` or a correct answer given as `"B"` are all things a
generator legitimately emits, and guessing wrong would silently drop a whole
module. Anything that cannot be read is reported as a warning on the generation
rather than dropped quietly.
"""

from collections import deque

# Our canonical item kinds — the vocabulary validators.py filters on.
LESSON = "lesson"
QUIZ = "quiz"
ASSIGNMENT = "assignment"

MODULE_LIST_KEYS = ("modules", "chapters", "sections", "units", "curriculum")
LESSON_LIST_KEYS = ("lessons", "topics", "lectures", "content_items", "contents")
QUIZ_KEYS = ("quiz", "quizzes", "assessment", "assessments", "test", "tests")
ASSIGNMENT_KEYS = ("assignment", "assignments", "task", "tasks", "project", "projects")
QUESTION_LIST_KEYS = ("questions", "items", "quiz_questions")
CHOICE_LIST_KEYS = ("choices", "options", "answers", "alternatives")

TITLE_KEYS = ("title", "name", "heading", "label")
DESCRIPTION_KEYS = ("description", "summary", "overview", "intro", "introduction")
SUMMARY_KEYS = ("summary", "overview", "description", "course_description", "abstract")
OBJECTIVE_KEYS = ("objectives", "learning_objectives", "goals", "course_objectives")
OUTCOME_KEYS = (
    "learning_outcomes",
    "outcomes",
    "what_you_will_learn",
    "whatYouWillLearn",
    "key_takeaways",
    "takeaways",
)
BODY_KEYS = (
    "body",
    "content",
    "markdown",
    "content_markdown",
    "text",
    "content_data",
    "lesson_content",
    "material",
    "notes",
    "description",
)
INSTRUCTION_KEYS = (
    "instructions",
    "instruction",
    "task",
    "brief",
    "prompt",
    "details",
    "description",
    "body",
    "content",
)
MINUTE_KEYS = (
    "estimated_minutes",
    "duration_minutes",
    "estimated_duration_minutes",
    "estimated_time_minutes",
    "duration",
    "minutes",
    "estimated_time",
    "time_minutes",
)
QUESTION_TEXT_KEYS = ("text", "question", "prompt", "question_text", "statement", "title")
MARK_KEYS = ("marks", "points", "score", "mark", "weight", "point_value")
CHOICE_TEXT_KEYS = ("text", "option", "label", "value", "answer", "content", "choice", "title")
ANSWER_KEYS = (
    "correct_answer",
    "correct_option",
    "correct_choice",
    "correct_index",
    "answer_index",
    "correct_option_index",
    "answer",
    "correct",
    "solution",
    "answer_text",
)

# Our Course.Difficulty values -> the service's 'beginner'|'intermediate'|'advanced'.
DIFFICULTY_MAP = {
    "BEGINNER": "beginner",
    "INTERMEDIATE": "intermediate",
    "ADVANCED": "advanced",
}

_KIND_SYNONYMS = {
    LESSON: {"lesson", "lecture", "topic", "reading", "text", "content", "module_lesson", "video"},
    QUIZ: {"quiz", "assessment", "test", "exam", "knowledge_check"},
    ASSIGNMENT: {"assignment", "task", "project", "exercise", "homework", "activity"},
}

_QUESTION_TYPE_SYNONYMS = {
    "MCQ": {
        "mcq", "multiple_choice", "multiplechoice", "multiple_select", "single_choice",
        "single_select", "choice", "radio", "select", "multi_choice", "multiple",
    },
    "TRUE_FALSE": {"true_false", "truefalse", "tf", "boolean", "bool", "yes_no", "yesno"},
    "SHORT_ANSWER": {
        "short_answer", "shortanswer", "short", "text", "open", "open_ended", "openended",
        "free_text", "freetext", "essay", "long_answer", "written", "descriptive",
    },
}

# Guards against a pathological/cyclic payload while still reaching a course
# nested a few envelopes deep (e.g. {"data": {"result": {"course": {...}}}}).
_MAX_SEARCH_DEPTH = 6
_MAX_SEARCH_BREADTH = 50


# --------------------------------------------------------------------------- #
# LMS -> service
# --------------------------------------------------------------------------- #


def build_tier_context(tier):
    """The tier is read-only context for tone and audience — the service is never
    told to attach the course to it (that stays server-owned, exactly as it was
    in the Gemini prompt)."""
    if tier is None:
        return None

    parts = [f"{tier.name} (Tier {tier.level})"]
    if getattr(tier, "audience", ""):
        parts.append(f"Audience: {tier.audience}")
    if getattr(tier, "focus_description", ""):
        parts.append(f"Focus: {tier.focus_description}")
    return " — ".join(parts)


def build_request_payload(form_payload, rag_enabled=False):
    """`form_payload` is GenerationRequestSerializer.validated_data as rehydrated
    by services._rehydrate_input (category/instructors/tier are model instances).

    `category_id` and `instructor_ids` are sent as context only. The real FKs are
    applied by writer.write_course_tree from this same form payload, so nothing
    the service returns can change which category or instructors a course gets."""

    category = form_payload.get("category")
    instructors = form_payload.get("instructors") or []
    objectives = [
        str(objective).strip()
        for objective in (form_payload.get("objectives") or [])
        if str(objective).strip()
    ]

    difficulty = DIFFICULTY_MAP.get(
        str(form_payload.get("difficulty") or "").upper(), "beginner"
    )

    return {
        "title": form_payload["title"],
        "category_id": str(category.id) if category is not None else None,
        "instructor_ids": [str(instructor.id) for instructor in instructors],
        "description": _or_none(form_payload.get("description")),
        "target_audience": _or_none(form_payload.get("target_audience")),
        "learning_objectives": objectives,
        "difficulty": difficulty,
        "num_modules": int(form_payload["modules_count"]),
        "lessons_per_module": int(form_payload["lessons_per_module"]),
        "include_quizzes": bool(form_payload.get("include_quizzes", True)),
        "questions_per_quiz": int(form_payload.get("questions_per_quiz") or 5),
        "include_assignments": bool(form_payload.get("include_assignments", True)),
        # Our serializer calls this `ai_grading`; it defaults True there and in
        # writer.py, so the default is repeated here rather than assumed present
        # (older job rows were serialized before the field existed).
        "ai_grading_enabled": bool(form_payload.get("ai_grading", True)),
        "weeks_between_modules": int(form_payload.get("weeks_between_modules") or 2),
        "additional_instructions": _or_none(form_payload.get("additional_instructions")),
        "tier_context": build_tier_context(form_payload.get("tier")),
        "price": _as_float(form_payload.get("amount")),
        # We follow the job over SSE/polling from a background thread, so there is
        # nothing for the service to call back into. Kept explicit so the field is
        # visibly a decision rather than an omission.
        "callback_url": None,
        "rag_enabled": bool(rag_enabled),
    }


def _or_none(value):
    text = str(value or "").strip()
    return text or None


def _as_float(value):
    """`amount` survives a JSONField round trip as a string (services._serialize_input)."""
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


# --------------------------------------------------------------------------- #
# service -> LMS
# --------------------------------------------------------------------------- #


def adapt_job_result(job_body, warnings):
    """Turns the finished job body into the plan shape validators.validate_and_repair
    expects. Appends to `warnings` for anything it had to guess at or could not read.

    Never raises for a shape it does not recognise: it returns a plan with no
    modules, and validate_and_repair fails the generation with its own message
    rather than this layer inventing one."""

    course_node, modules_key = _find_course_node(job_body)

    if course_node is None:
        warnings.append(
            "The AI service's job result did not contain anything that looks like a "
            "course structure (no modules/chapters/sections list was found)."
        )
        return {"summary": "", "objectives": [], "learning_outcomes": [], "modules": []}

    # Course-level copy may sit beside the modules or one envelope up, so both
    # are searched before giving up on a field.
    lookups = [course_node, job_body if isinstance(job_body, dict) else {}]

    raw_modules = course_node.get(modules_key) or []
    modules = []
    for index, entry in enumerate(raw_modules, start=1):
        if not isinstance(entry, dict):
            warnings.append(f"Module {index} from the AI service was malformed and was dropped.")
            continue
        modules.append(_adapt_module(entry, index, warnings))

    return {
        "summary": _first_text(lookups, SUMMARY_KEYS),
        "objectives": _first_string_list(lookups, OBJECTIVE_KEYS),
        "learning_outcomes": _first_string_list(lookups, OUTCOME_KEYS),
        "modules": modules,
    }


def _find_course_node(root):
    """Breadth-first search for the dict that holds the module list, so the
    shallowest match wins — `{"data": {"modules": [...]}}` and a bare
    `{"modules": [...]}` both resolve, and a stray nested `sections` deeper in
    the payload cannot outrank the real one."""

    queue = deque([(root, 0)])
    seen = 0

    while queue and seen < _MAX_SEARCH_BREADTH:
        node, depth = queue.popleft()
        seen += 1

        if isinstance(node, dict):
            for key in MODULE_LIST_KEYS:
                value = node.get(key)
                if isinstance(value, list) and value:
                    return node, key
            if depth < _MAX_SEARCH_DEPTH:
                for value in node.values():
                    if isinstance(value, (dict, list)):
                        queue.append((value, depth + 1))
        elif isinstance(node, list) and depth < _MAX_SEARCH_DEPTH:
            for value in node[:_MAX_SEARCH_BREADTH]:
                if isinstance(value, (dict, list)):
                    queue.append((value, depth + 1))

    return None, None


def _adapt_module(entry, index, warnings):
    module_label = f"Module {index}"
    return {
        "title": _text(entry, TITLE_KEYS) or f"Module {index}",
        "description": _text(entry, DESCRIPTION_KEYS),
        "items": _adapt_module_items(entry, module_label, warnings),
    }


def _adapt_module_items(module, module_label, warnings):
    """Two layouts are handled: a single typed list (`items` with a `kind`/`type`
    per entry — what Gemini produced and what this plan shape is built around),
    or separate `lessons`/`quiz`/`assignment` collections."""

    typed = _typed_items(module)
    if typed:
        items = []
        for raw, kind in typed:
            adapted = _adapt_item(raw, kind, module_label, warnings)
            if adapted is not None:
                items.append(adapted)
        return items

    items = [_adapt_lesson(raw) for raw in _collect(module, LESSON_LIST_KEYS)]

    if not items:
        # Last resort: an untyped `items`/`elements` list. Treating these as
        # lessons is a guess, so it is a warning the admin sees on the draft.
        untyped = _collect(module, ("items", "elements", "children"))
        if untyped:
            warnings.append(
                f"{module_label}: the AI service returned content without a type — "
                "it was imported as lessons."
            )
            items = [_adapt_lesson(raw) for raw in untyped]

    items.extend(_adapt_quizzes(_collect(module, QUIZ_KEYS), module_label, warnings))
    items.extend(
        _adapt_assignment(raw) for raw in _collect(module, ASSIGNMENT_KEYS)
    )
    return items


def _typed_items(module):
    """Returns [(raw_item, kind)] when the module carries one list of typed
    entries, or [] when it does not — in which case the caller reads the
    per-kind collections instead."""

    for key in ("items", "contents", "elements", "children", "activities"):
        raw = module.get(key)
        if not isinstance(raw, list):
            continue
        typed = []
        for entry in raw:
            if not isinstance(entry, dict):
                continue
            kind = _normalize_kind(
                _text(entry, ("kind", "type", "item_type", "content_type", "resource_type"))
            )
            if kind:
                typed.append((entry, kind))
        if typed:
            return typed
    return []


def _normalize_kind(value):
    key = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    if not key:
        return None
    for kind, synonyms in _KIND_SYNONYMS.items():
        if key in synonyms:
            return kind
    return None


def _adapt_item(raw, kind, module_label, warnings):
    if kind == LESSON:
        return _adapt_lesson(raw)
    if kind == QUIZ:
        return _adapt_quiz(raw, module_label, warnings)
    if kind == ASSIGNMENT:
        return _adapt_assignment(raw)
    return None


def _adapt_lesson(raw):
    return {
        "kind": LESSON,
        "title": _text(raw, TITLE_KEYS),
        "body": _body_text(raw),
        "estimated_minutes": _minutes(_value(raw, MINUTE_KEYS)),
    }


def _adapt_quizzes(sources, module_label, warnings):
    """A module's quiz can arrive as one quiz object, as a list of quizzes, or —
    seen in the wild — as a bare list of questions under `quizzes`. The last case
    is detected rather than turned into one quiz per question, which would hand
    validators a pile of single-question quizzes to merge."""

    if not sources:
        return []

    if all(_looks_like_question(source) for source in sources):
        questions = [_adapt_question(source, warnings) for source in sources]
        return [
            {
                "kind": QUIZ,
                "title": f"{module_label} Quiz",
                "body": "",
                "questions": [question for question in questions if question],
            }
        ]

    return [_adapt_quiz(source, module_label, warnings) for source in sources]


def _adapt_quiz(raw, module_label, warnings):
    raw_questions = _first_list(raw, QUESTION_LIST_KEYS)
    questions = []
    for entry in raw_questions:
        if not isinstance(entry, dict):
            continue
        adapted = _adapt_question(entry, warnings)
        if adapted is not None:
            questions.append(adapted)

    return {
        "kind": QUIZ,
        "title": _text(raw, TITLE_KEYS) or f"{module_label} Quiz",
        "body": "",
        "questions": questions,
    }


def _adapt_assignment(raw):
    instructions = _text(raw, INSTRUCTION_KEYS)
    return {
        "kind": ASSIGNMENT,
        "title": _text(raw, TITLE_KEYS),
        # validators._repair_assignment_items reads `instructions` first and
        # `body` second; both are filled so either order works.
        "body": instructions,
        "instructions": instructions,
    }


def _looks_like_question(entry):
    if not isinstance(entry, dict):
        return False
    if _first_list(entry, QUESTION_LIST_KEYS):
        return False
    has_text = bool(_text(entry, QUESTION_TEXT_KEYS))
    has_answer_shape = bool(_first_list(entry, CHOICE_LIST_KEYS)) or _value(entry, ANSWER_KEYS) is not None
    return has_text and has_answer_shape


def _adapt_question(raw, warnings):
    text = _text(raw, QUESTION_TEXT_KEYS)
    if not text:
        # Left to validators: repair_question drops a blank question and records
        # the warning itself, so the admin gets one consistent message for it.
        return {"text": "", "question_type": "MCQ", "marks": 1, "choices": []}

    choices = _adapt_choices(raw)
    question_type = _normalize_question_type(_text(raw, ("question_type", "type", "kind", "format")))

    if question_type is None:
        question_type = _infer_question_type(choices)

    if question_type == "SHORT_ANSWER":
        choices = []
    else:
        answer = _value(raw, ANSWER_KEYS)
        if question_type == "TRUE_FALSE" and not choices and answer is not None:
            choices = [{"text": "True", "is_correct": False}, {"text": "False", "is_correct": False}]
        if choices and not any(choice["is_correct"] for choice in choices):
            if not _mark_correct(choices, answer):
                warnings.append(
                    f"Question '{text[:50]}' came back without a marked correct answer."
                )

    return {
        "text": text,
        "question_type": question_type,
        "marks": _marks(_value(raw, MARK_KEYS)),
        "choices": choices,
    }


def _adapt_choices(raw_question):
    choices = []
    for entry in _first_list(raw_question, CHOICE_LIST_KEYS):
        if isinstance(entry, str):
            text = entry.strip()
            is_correct = False
        elif isinstance(entry, dict):
            text = _text(entry, CHOICE_TEXT_KEYS)
            is_correct = _as_bool(
                _value(entry, ("is_correct", "isCorrect", "correct", "is_answer", "right"))
            )
        else:
            continue
        if text:
            choices.append({"text": text, "is_correct": is_correct})
    return choices


def _mark_correct(choices, answer):
    """Marks the choice(s) the question's answer field points at. Returns whether
    anything was matched, so an unresolvable answer becomes a visible warning
    instead of validators silently promoting the first choice."""

    if answer is None or not choices:
        return False

    if isinstance(answer, (list, tuple, set)):
        return any(_mark_correct(choices, item) for item in answer)

    if isinstance(answer, bool):
        return _mark_correct(choices, "True" if answer else "False")

    if isinstance(answer, int):
        # 0-based first; a 1-based service only differs when the index is exactly
        # len(choices), which 0-based cannot address anyway.
        if 0 <= answer < len(choices):
            choices[answer]["is_correct"] = True
            return True
        if 1 <= answer <= len(choices):
            choices[answer - 1]["is_correct"] = True
            return True
        return False

    text = str(answer).strip()
    if not text:
        return False

    for choice in choices:
        if choice["text"].strip().lower() == text.lower():
            choice["is_correct"] = True
            return True

    if text.lstrip("-").isdigit():
        return _mark_correct(choices, int(text))

    # "B" / "b)" / "(C)" — a letter referring to the choice's position.
    letter = text.strip("().: ").upper()
    if len(letter) == 1 and "A" <= letter <= "Z":
        index = ord(letter) - ord("A")
        if index < len(choices):
            choices[index]["is_correct"] = True
            return True

    return False


def _normalize_question_type(value):
    key = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    if not key:
        return None
    for question_type, synonyms in _QUESTION_TYPE_SYNONYMS.items():
        if key in synonyms:
            return question_type
    # Already one of ours (the service may simply mirror the LMS vocabulary).
    upper = key.upper()
    if upper in ("MCQ", "TRUE_FALSE", "SHORT_ANSWER"):
        return upper
    return None


def _infer_question_type(choices):
    if not choices:
        return "SHORT_ANSWER"
    texts = {choice["text"].strip().lower() for choice in choices}
    if len(choices) == 2 and texts == {"true", "false"}:
        return "TRUE_FALSE"
    return "MCQ"


# --------------------------------------------------------------------------- #
# small readers
# --------------------------------------------------------------------------- #


def _value(node, keys):
    if not isinstance(node, dict):
        return None
    for key in keys:
        if node.get(key) is not None:
            return node[key]
    return None


def _text(node, keys):
    value = _value(node, keys)
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float)):
        return str(value)
    return ""


def _first_text(nodes, keys):
    for node in nodes:
        text = _text(node, keys)
        if text:
            return text
    return ""


def _first_list(node, keys):
    value = _value(node, keys)
    return value if isinstance(value, list) else []


def _collect(node, keys):
    """Flattens the dict-or-list-of-dicts a single key may hold."""
    collected = []
    if not isinstance(node, dict):
        return collected
    for key in keys:
        value = node.get(key)
        if isinstance(value, dict):
            collected.append(value)
        elif isinstance(value, list):
            collected.extend(entry for entry in value if isinstance(entry, dict))
    return collected


def _string_list(value):
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if not isinstance(value, list):
        return []

    items = []
    for entry in value:
        if isinstance(entry, str) and entry.strip():
            items.append(entry.strip())
        elif isinstance(entry, dict):
            text = _text(entry, ("text", "title", "label", "outcome", "objective", "description"))
            if text:
                items.append(text)
    return items


def _first_string_list(nodes, keys):
    for node in nodes:
        items = _string_list(_value(node, keys))
        if items:
            return items
    return []


def _body_text(node):
    """Lesson prose, whether the service sends a markdown string, a list of
    blocks, or a nested content object."""
    return _extract_body(_value(node, BODY_KEYS), depth=0)


def _extract_body(value, depth):
    if isinstance(value, str):
        return value.strip()
    if depth >= 3:
        return ""
    if isinstance(value, list):
        parts = [_extract_body(entry, depth + 1) for entry in value]
        return "\n\n".join(part for part in parts if part)
    if isinstance(value, dict):
        return _extract_body(_value(value, BODY_KEYS), depth + 1)
    return ""


def _minutes(value):
    """validators._clamp_minutes handles the rest; this only has to turn the
    service's spelling ("45", 45.0, "45 minutes") into a number."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        digits = "".join(char for char in value if char.isdigit())
        if digits:
            return int(digits)
    return None


def _marks(value):
    if isinstance(value, bool) or value is None:
        return 1
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        digits = "".join(char for char in value if char.isdigit())
        if digits:
            return int(digits)
    return 1


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in ("true", "1", "yes", "y", "t", "correct")
    return False
