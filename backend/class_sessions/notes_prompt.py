"""Prompt + structured-output schema for a class's AI meeting notes.

The framing is the whole feature. What a transcript of a lesson most invites
a model to produce is a summary of the *conversation* — "the teacher greeted
the class, a student asked about the homework" — which is worthless to the
person this document exists for: somebody who was not in the room and wants
to know what was taught. So the model is told, repeatedly and specifically,
to write up the **material**, in the order it was taught, and to treat the
mechanics of the meeting as noise.

Three rules in here are not stylistic and must survive an edit:

* **Nothing may be added that was not said.** A model asked to write lesson
  notes will helpfully complete a half-explained definition from what it
  already knows, and a student revising from that has no way to tell the two
  apart. If the class got a definition wrong, the notes record what the class
  was told — correcting it is the teacher's job, not the notes'.

* **A student is never named.** A transcript carries who asked what, and a
  document emailed to thirty classmates naming the person who asked the
  obvious question is a document that makes people stop asking. The teacher
  may be named because they are presenting; everyone else is "a student".

* **An empty class is reported as empty.** A room where nobody spoke, or
  where the only words are "can you hear me", produces notes that say so —
  `has_content` is false and the frontend shows that instead of a page of
  invented structure. A model that cannot find a lesson must not write one.
"""

SYSTEM_FRAMING = (
    "You are writing the official notes for a class that has just finished, "
    "for the students on the course — including the ones who could not "
    "attend. You were not in the room; all you have is an automatic "
    "transcript of what was said, which is imperfect, unpunctuated in places "
    "and will have misheard names and technical terms.\n\n"
    "Write up the material, not the meeting. Nobody reading this needs to "
    "know who said hello, who had connection trouble or when the register "
    "was taken — they need what was taught, in the order it was taught, in "
    "enough detail to revise from.\n\n"
    "Three rules you do not break:\n"
    "1. Everything you write must come from the transcript. Do not complete, "
    "correct or enrich an explanation from your own knowledge, even when you "
    "can see it is incomplete or wrong — these notes record what this class "
    "was told. Where the transcript is unclear, say less rather than "
    "guessing.\n"
    "2. Name the teacher if you like; never name a student. Write 'a student "
    "asked' rather than identifying who.\n"
    "3. If there was no lesson in this transcript — an empty room, a few "
    "words of setup, nothing taught — set has_content to false and leave the "
    "rest brief. Do not manufacture structure that was not there."
)

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "has_content": {
            "type": "boolean",
            "description": (
                "False only if this transcript contains no actual teaching — an "
                "empty room, audio checks, a couple of lines of small talk."
            ),
        },
        "title": {
            "type": "string",
            "description": (
                "What this class was about, in a few words, taken from what was "
                "actually taught rather than from the scheduled title."
            ),
        },
        "summary": {
            "type": "string",
            "description": (
                "3-6 sentences a student who missed the class can read to know what "
                "they missed. Plain prose, no bullet points, no 'in this session'."
            ),
        },
        "key_topics": {
            "type": "array",
            "items": {"type": "string"},
            "description": (
                "The subjects covered, in the order they were taught. A few words "
                "each, not sentences. 3-8 of them."
            ),
        },
        "important_points": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "point": {
                        "type": "string",
                        "description": "One thing worth remembering, stated as the class was told it.",
                    },
                    "detail": {
                        "type": "string",
                        "description": (
                            "The explanation, example or working that was given for it, "
                            "in a sentence or two. Empty if none was given."
                        ),
                    },
                },
                "required": ["point", "detail"],
            },
            "description": "The substance of the lesson — definitions, rules, worked examples, warnings.",
        },
        "action_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "Something the class was actually asked to go and do.",
                    },
                    "owner": {
                        "type": "string",
                        "description": (
                            "Who it is for — normally 'All students'. Never an individual "
                            "student's name."
                        ),
                    },
                    "due": {
                        "type": "string",
                        "description": "When it is due, only if that was said. Empty otherwise.",
                    },
                },
                "required": ["task", "owner", "due"],
            },
            "description": (
                "Homework, reading and preparation that was set. Empty if none was — do "
                "not invent work nobody was given."
            ),
        },
        "next_class": {
            "type": "string",
            "description": (
                "What the teacher said the next class would cover. Empty if they did not "
                "say."
            ),
        },
    },
    "required": [
        "has_content",
        "title",
        "summary",
        "key_topics",
        "important_points",
        "action_items",
        "next_class",
    ],
}


def _agenda_block(agenda):
    """The planned agenda as bullets, or a plain "(none given)".

    Shared by both prompts below so a session with no agenda reads the same
    way to the model in either of them.
    """
    lines = [str(line).strip() for line in (agenda or []) if str(line).strip()]
    return "\n".join(f"- {line}" for line in lines) if lines else "(none given)"


def build_prompt(*, context, transcript):
    """The whole instruction, with the session's own context around the words.

    The scheduled title, heading and agenda are given as *context*, explicitly
    labelled as what the session was supposed to be about rather than as source
    material — a teacher who spent the hour on something else must get notes
    about what they taught, not about what the calendar said.

    `context` is a plain mapping, not a model: two different things are
    written up through this one prompt — a course's live class and a War Room
    Live audio session — and neither has to pretend to be the other to be
    summarised. Each supplies its own
    (`ClassSession.notes_context` / `LiveSession.notes_context`), and the
    only keys read here are `heading`, `title`, `description` and `agenda`.
    """
    return (
        f"{SYSTEM_FRAMING}\n\n"
        "---\n"
        "CONTEXT — what this class was scheduled to be. Use it only to read the "
        "transcript better (it tells you which technical terms are likely, and how "
        "the automatic transcription may have misheard them). Do NOT write it up: "
        "if the class covered something else, the notes are about what it covered.\n\n"
        f"{context.get('heading') or ''}\n"
        f"Scheduled title: {context.get('title') or '(none given)'}\n"
        f"Description: {context.get('description') or '(none given)'}\n"
        f"Planned agenda:\n{_agenda_block(context.get('agenda'))}\n\n"
        "---\n"
        "TRANSCRIPT — the automatic transcript of the class. Speaker labels come "
        "from the video call and may be missing or wrong; the words themselves may "
        "contain mishearings. Write the notes from this and from nothing else.\n\n"
        f"{transcript}\n"
    )


# ---------------------------------------------------------------------------
# Turning the class's own audio into a transcript
# ---------------------------------------------------------------------------
#
# Only used by the **local** notes source, where there is no transcription
# service in the path at all: the teacher's browser records the room and the
# model is asked to write down what it hears. Everything downstream — the
# prompt above, the schema, the document, the emails — is identical, because
# this step produces exactly what Agora's captions produced: a transcript.
#
# Two rules here are the same two that govern the notes, for the same reasons,
# and are if anything more easily broken at this step:
#
# * **Nothing may be added.** A model asked to "transcribe" a muffled sentence
#   will cheerfully produce a fluent one. A transcript is evidence — the
#   teacher reads it to check the notes against — so an unclear passage is
#   marked unclear rather than smoothed over.
#
# * **A name is used only where it was measured, never where it was guessed.**
#   What reaches the model is one mixed track, and no amount of listening to
#   a mix tells you which of three voices belongs to whom. So the browser
#   that did the mixing writes down who was speaking when
#   (`ClassSessionNotesAudio.speakers`), and that table — not the model's ear
#   — is what puts a name on a line. Where the table does not say, or two
#   people talk over each other, the turn is "Speaker". A name attached to
#   the wrong voice is worse than no name at all, and this is a record of a
#   room that may be full of minors.

TRANSCRIPT_SCHEMA = {
    "type": "object",
    "properties": {
        "has_speech": {
            "type": "boolean",
            "description": (
                "False if this recording contains no speech at all — silence, room "
                "noise, a held microphone. True if anybody said anything."
            ),
        },
        "transcript": {
            "type": "string",
            "description": (
                "What was said, verbatim, as plain text. One line per turn, each "
                "beginning with the speaker's name and a colon — 'Manan: ', "
                "'Ali: ' — taken from the list of who was speaking when, or "
                "'Speaker: ' where that list does not say. Empty if has_speech "
                "is false."
            ),
        },
    },
    "required": ["has_speech", "transcript"],
}

TRANSCRIPT_FRAMING = (
    "You are transcribing a recording of a school or college class. The audio is "
    "everybody in a video call mixed into one track, so voices overlap, some "
    "people are far from their microphone and the quality varies.\n\n"
    "Write down what was said and nothing else. This is a record, not a "
    "summary: do not shorten it, do not tidy the grammar into something nobody "
    "said, and do not complete or correct an explanation from your own "
    "knowledge even when you can hear that it is wrong or unfinished. Where you "
    "genuinely cannot make out a word, write [inaudible] rather than guessing — "
    "somebody will read this to check what the class was actually told.\n\n"
    "Lay it out as a conversation, one line per turn, each beginning with the "
    "speaker's name and a colon:\n\n"
    "Manan: so the first thing we need to do is set the course up\n"
    "Ali: do we do that before or after the enrolment?\n"
    "Manan: after, always after\n\n"
    "Start a new line every time the speaker changes, and keep the turns in the "
    "order they happened.\n\n"
    "**Use only the names in the list below**, which was measured by the "
    "software while the class was running — it is not a guess and it is not "
    "something to improve on. Where the list does not cover a moment, where two "
    "people are talking over each other, or where you are not confident which "
    "of them is speaking, write 'Speaker: ' instead. Never invent a name, never "
    "use a name you merely heard somebody say, and never move a line to a "
    "different speaker because it sounds more like something they would say. A "
    "sentence filed under the wrong person is worse than one filed under "
    "nobody.\n\n"
    "If there is no speech in this recording at all, set has_speech to false "
    "and leave the transcript empty. Do not describe the silence."
)


def _speaker_block(speakers):
    """Who was speaking when, as a table the model reads alongside the audio.

    `speakers` is `[(seconds_from_the_start_of_this_recording, name), ...]`
    already resolved to names by the caller. Consecutive entries for the same
    person are collapsed, because the browser samples several times a second
    and the model does not need to be told four times that Ali is still
    talking.
    """
    lines = []
    last_name = None
    for at, name in speakers or []:
        if name == last_name:
            continue
        last_name = name
        minutes, seconds = divmod(int(max(0, at)), 60)
        lines.append(f"{minutes:d}:{seconds:02d} — {name}")
    return "\n".join(lines)


def build_transcript_prompt(
    *, context, part_index, part_count, previous_tail="", speakers=None
):
    """The instruction for one segment of a session's audio.

    `context` is the same mapping `build_prompt` takes, from the same place
    (`ClassSession.notes_context` / `LiveSession.notes_context`).

    The session's own title and agenda are given for the same reason they are
    given to the notes: they tell the model which technical terms and proper
    nouns are likely in this room, which is most of the difference between
    "first normal form" and "first normal form" misheard. They are context for
    listening, never something to write up.

    `previous_tail` is the last few lines of the previous segment. A class is
    cut on a timer, so a sentence genuinely straddles two recordings — handing
    the model the end of the last one is what stops the first line of this one
    starting mid-thought. It is explicitly marked as *not* to be repeated.

    `speakers` is `[(seconds, name), ...]` for this recording, measured by the
    browser that mixed it. Without it every turn is "Speaker", which is the
    honest answer for a single mixed track — the model cannot hear whose
    voice is whose, and must not pretend otherwise.
    """
    position = (
        f"This is part {part_index + 1} of {part_count} of one class."
        if part_count > 1
        else "This is the recording of one class."
    )
    continuation = (
        "\n\nThe previous part ended with the lines below. They are here only so "
        "you can hear where this part picks up — do NOT repeat them in your "
        "answer, which must contain only what is said in this recording.\n\n"
        f"{previous_tail}\n"
        if previous_tail
        else ""
    )

    agenda_block = _agenda_block(context.get("agenda"))

    timeline = _speaker_block(speakers)
    speaker_section = (
        "WHO WAS SPEAKING, AND WHEN — measured by the software while the class "
        "ran, as minutes:seconds from the start of *this* recording. These are "
        "the only names you may use.\n\n"
        f"{timeline}\n"
        if timeline
        else "WHO WAS SPEAKING — not known for this recording. Begin every turn "
        "with 'Speaker: '.\n"
    )

    return (
        f"{TRANSCRIPT_FRAMING}\n\n"
        "---\n"
        f"{position}\n\n"
        f"{speaker_section}\n"
        "---\n"
        "CONTEXT — what this class was scheduled to be. Use it only to hear the "
        "words better: it tells you which subject terms are likely. Do not write "
        "any of it down, and do not assume the class stuck to it.\n\n"
        f"{context.get('heading') or ''}\n"
        f"Scheduled title: {context.get('title') or '(none given)'}\n"
        f"Planned agenda:\n{agenda_block}"
        f"{continuation}"
    )
