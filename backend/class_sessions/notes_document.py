"""Renders a class's meeting notes into a PDF students can keep.

The notes already exist as structured data on `ClassSessionNotes`, and the
portal renders them as a page — so this is the *take-away* copy: the thing a
student files with their revision, prints, or opens six months later when the
course has finished and the portal no longer lists the class.

Deliberately a plain document and not a report. The content is the notes;
everything this adds is the four facts that make a loose PDF identifiable a
year later (which course, which class, which date, who taught it) and the one
line that stops it being mistaken for the teacher's own word: an automatic
transcript was involved, and it can mishear.

reportlab is an optional import, exactly as it is in
`courses/management/commands/_handouts.py`: a machine without it still takes
notes, with the PDF simply absent. The notes themselves are in the database
and on the screen either way, so a missing renderer costs a download, not a
lesson.
"""

import logging
import re

logger = logging.getLogger(__name__)

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        ListFlowable,
        ListItem,
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
    )

    PDF_AVAILABLE = True
except ImportError:  # pragma: no cover - exercised only where reportlab is absent
    PDF_AVAILABLE = False

# The same ink as a course handout, so a student's downloads folder looks like
# one course rather than two products.
INK = "#1F2321"
MUTED = "#6B7280"
ACCENT = "#8A6E2F"


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "NotesTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            alignment=TA_LEFT,
            textColor=colors.HexColor(INK),
            spaceAfter=2,
        ),
        "subtitle": ParagraphStyle(
            "NotesSubtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor(MUTED),
            spaceAfter=12,
        ),
        "heading": ParagraphStyle(
            "NotesHeading",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=colors.HexColor(ACCENT),
            spaceBefore=14,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "NotesBody",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor(INK),
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "NotesBullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor(INK),
        ),
        "detail": ParagraphStyle(
            "NotesDetail",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            leftIndent=12,
            textColor=colors.HexColor(MUTED),
            spaceAfter=4,
        ),
        "speaker": ParagraphStyle(
            "NotesSpeaker",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor(INK),
            spaceAfter=5,
            # The name hangs in the left margin and the words line up under
            # each other, which is what makes a page of dialogue scannable:
            # the eye finds who is talking without reading the sentence.
            leftIndent=58,
            firstLineIndent=-58,
        ),
        "footnote": ParagraphStyle(
            "NotesFootnote",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor(MUTED),
            spaceBefore=16,
        ),
    }


def _escape(text):
    """reportlab's Paragraph parses its input as mini-HTML.

    A transcript is full of `&` and `<`, so anything from the model is escaped
    before it is handed over — otherwise a student saying "x < y" silently
    swallows the rest of the paragraph.
    """
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _bullets(items, styles):
    return ListFlowable(
        [ListItem(Paragraph(_escape(item), styles["bullet"]), leftIndent=14) for item in items],
        bulletType="bullet",
        bulletFontSize=7,
        bulletColor=colors.HexColor(ACCENT),
        leftIndent=14,
        spaceAfter=6,
    )


# How a transcript line arrives from the model: "Name: what they said".
_SPEAKER_LINE = re.compile(r"^\s*([^:\n]{1,60}?)\s*:\s*(.+)$")


def _transcript_flowables(transcript, styles):
    """The conversation, laid out as one.

    Each line comes from the model as "Name: words", so the name is pulled
    out and set in bold against a hanging indent — a page of dialogue is read
    by finding the speakers first and the sentences second. A line that does
    not have that shape (a stray note, a model that ran the turns together)
    is printed as it stands rather than forced into a shape it is not.
    """
    flowables = []
    for raw in str(transcript or "").splitlines():
        line = raw.strip()
        if not line:
            continue
        match = _SPEAKER_LINE.match(line)
        if match:
            speaker, words = match.groups()
            flowables.append(
                Paragraph(
                    f"<b>{_escape(speaker)}:</b> {_escape(words)}", styles["speaker"]
                )
            )
        else:
            flowables.append(Paragraph(_escape(line), styles["speaker"]))
    return flowables


def build_notes_pdf(notes, *, session, destination, transcript=None):
    """Writes the notes to `destination` (a path or a file-like object).

    Sections with nothing in them are omitted rather than printed empty: a
    class that set no homework should not hand out a document with an
    "Action items" heading and a blank under it, which reads as something
    having gone missing.

    `transcript` appends the verbatim record of the class under everything
    else. It is **passed in rather than read off `notes`** so that this
    function cannot accidentally put it in a document meant for students: the
    write-up is for the class, the words are for the course's teachers, and
    only `views.ClassSessionNotesDocumentView` — which has already asked who
    is downloading — decides which of the two it is rendering.
    """
    if not PDF_AVAILABLE:  # pragma: no cover - guarded by the caller
        raise RuntimeError("reportlab is not installed")

    styles = _styles()
    margin = 0.85 * inch
    document = SimpleDocTemplate(
        destination,
        pagesize=LETTER,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
        title=notes.title or session.title,
        author="Cool Nerds",
    )

    taught_by = ""
    if session.teacher_id and session.teacher:
        taught_by = session.teacher.name or session.teacher.username

    meta = " · ".join(
        part
        for part in (
            f"{session.course.code} — {session.course.title}",
            session.scheduled_at.strftime("%d %B %Y, %H:%M UTC"),
            f"Taught by {taught_by}" if taught_by else "",
            f"{session.duration_minutes} minutes",
        )
        if part
    )

    story = [
        Paragraph(_escape(notes.title or session.title), styles["title"]),
        Paragraph(_escape(meta), styles["subtitle"]),
    ]

    if notes.summary:
        story.append(Paragraph("Summary", styles["heading"]))
        story.append(Paragraph(_escape(notes.summary), styles["body"]))

    if notes.key_topics:
        story.append(Paragraph("What we covered", styles["heading"]))
        story.append(_bullets(notes.key_topics, styles))

    if notes.important_points:
        story.append(Paragraph("Key points", styles["heading"]))
        for entry in notes.important_points:
            point = (entry or {}).get("point") if isinstance(entry, dict) else entry
            detail = (entry or {}).get("detail") if isinstance(entry, dict) else ""
            if not point:
                continue
            story.append(Paragraph(f"<b>{_escape(point)}</b>", styles["body"]))
            if detail:
                story.append(Paragraph(_escape(detail), styles["detail"]))

    if notes.action_items:
        story.append(Paragraph("Action items", styles["heading"]))
        lines = []
        for entry in notes.action_items:
            if not isinstance(entry, dict):
                entry = {"task": entry}
            task = entry.get("task")
            if not task:
                continue
            trailer = " · ".join(
                part for part in (entry.get("owner"), entry.get("due")) if part
            )
            lines.append(f"{task} ({trailer})" if trailer else task)
        if lines:
            story.append(_bullets(lines, styles))

    if notes.next_class:
        story.append(Paragraph("Next class", styles["heading"]))
        story.append(Paragraph(_escape(notes.next_class), styles["body"]))

    if transcript:
        story.append(PageBreak())
        story.append(Paragraph("Transcript", styles["heading"]))
        story.append(
            Paragraph(
                "The full conversation, as it was heard. Only this course's "
                "teachers receive this page.",
                styles["detail"],
            )
        )
        story.append(Spacer(1, 4))
        story.extend(_transcript_flowables(transcript, styles))

    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "These notes were written automatically from a transcript of the class "
            "and have not been checked by your teacher. The transcript can mishear "
            "names and technical terms, so treat anything surprising as a note to "
            "ask about rather than as a correction to what you were taught.",
            styles["footnote"],
        )
    )

    document.build(story)
    return destination
