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


def build_prompt(*, session, transcript, agenda=None):
    """The whole instruction, with the class's own context around the words.

    The scheduled title, course and agenda are given as *context*, explicitly
    labelled as what the class was supposed to be about rather than as source
    material — a teacher who spent the hour on something else must get notes
    about what they taught, not about what the calendar said.
    """
    agenda_lines = [str(line).strip() for line in (agenda or []) if str(line).strip()]
    agenda_block = (
        "\n".join(f"- {line}" for line in agenda_lines) if agenda_lines else "(none given)"
    )

    return (
        f"{SYSTEM_FRAMING}\n\n"
        "---\n"
        "CONTEXT — what this class was scheduled to be. Use it only to read the "
        "transcript better (it tells you which technical terms are likely, and how "
        "the automatic transcription may have misheard them). Do NOT write it up: "
        "if the class covered something else, the notes are about what it covered.\n\n"
        f"Course: {session.course.code} — {session.course.title}\n"
        f"Scheduled title: {session.title}\n"
        f"Description: {session.description or '(none given)'}\n"
        f"Planned agenda:\n{agenda_block}\n\n"
        "---\n"
        "TRANSCRIPT — the automatic transcript of the class. Speaker labels come "
        "from the video call and may be missing or wrong; the words themselves may "
        "contain mishearings. Write the notes from this and from nothing else.\n\n"
        f"{transcript}\n"
    )
