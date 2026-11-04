"""WebVTT caption slices in, one readable transcript out.

Agora's Real-Time Transcription writes what it hears into our bucket as an
HLS caption set: an `.m3u8` playlist naming a run of `.vtt` slices, one every
`sliceDuration` seconds. Nothing downstream wants any of that — the model
that writes the meeting notes wants the words, in order, with a name against
them where one is known — so the whole format stops here.

Three things about live-caption VTT shape this module, and all three are the
kind of thing that is invisible until the notes read wrongly:

* **A slice is not a sentence.** Agora cuts on the clock, so a sentence that
  straddles a slice boundary arrives as two cues in two files. The slices are
  therefore concatenated *before* anything is interpreted, in playlist order
  where a playlist is available and in key order otherwise (the names sort by
  time either way, but the playlist is the thing that actually knows).

* **Interim captions are re-sent as they are refined.** Live transcription
  emits "so the first" then "so the first normal" then "so the first normal
  form", and a recorder that writes every revision leaves three cues where a
  reader expects one. `_drop_superseded` keeps only the last of any run of
  cues where each extends the one before it — which is a rewrite of the same
  words, not a repetition of them. Identical consecutive cues collapse for
  the same reason. A genuine repetition separated by anything else survives,
  because a teacher saying "stop" twice is a teacher saying it twice.

* **The speaker, when there is one, is in a `<v>` tag.** WebVTT carries it as
  `<v Speaker Name>text`, and Agora puts the channel uid there. Mapping that
  uid back to a person is the caller's job (`services._speaker_map`): this
  module only separates the label from the words, and leaves the label alone
  when it cannot be read.

Nothing here raises. A caption file that is empty, truncated mid-cue or not
VTT at all contributes nothing and the rest of the class is still written up
— the alternative is losing an hour of teaching to one malformed slice.
"""

import logging
import re

logger = logging.getLogger(__name__)

# A cue's timing line: `00:00:01.000 --> 00:00:04.000` with optional settings
# after it. Hours are optional in WebVTT, hence the two shapes.
TIMING_LINE = re.compile(
    r"^\s*(?:\d{1,}:)?\d{2}:\d{2}[.,]\d{1,3}\s*-->\s*(?:\d{1,}:)?\d{2}:\d{2}[.,]\d{1,3}"
)

# `<v Speaker Name>` — WebVTT's voice span. The closing `</v>` is optional in
# the wild, so the text is taken as everything after the opening tag.
VOICE_SPAN = re.compile(r"^<v(?:\.[^\s>]+)*\s+([^>]*)>(.*)$", re.DOTALL)

# Any other inline markup: `<c.classname>`, `<b>`, `<00:00:01.000>` karaoke
# timestamps. Stripped rather than rendered — none of it is a word anyone said.
INLINE_TAG = re.compile(r"</?[^>]+>")

# Lines that are structure rather than speech.
BLOCK_KEYWORDS = ("NOTE", "STYLE", "REGION")

# An `.m3u8` comment line. Everything else in a playlist is a file name.
PLAYLIST_COMMENT = "#"


class Cue:
    """One caption: who said it (if known) and what they said."""

    __slots__ = ("speaker", "text")

    def __init__(self, speaker, text):
        self.speaker = speaker
        self.text = text

    def __eq__(self, other):  # pragma: no cover - test convenience
        return (
            isinstance(other, Cue)
            and other.speaker == self.speaker
            and other.text == self.text
        )

    def __repr__(self):  # pragma: no cover - debugging aid
        return f"Cue(speaker={self.speaker!r}, text={self.text!r})"


def playlist_order(playlist_text, available_keys):
    """The caption keys in the order an `.m3u8` playlist names them.

    Agora's slice names sort by time on their own, so this is a refinement
    rather than a rescue — but a playlist is the only thing that actually
    *knows* the order, and a store that ever names slices differently would
    otherwise reorder a class's words without saying so.

    Keys the playlist doesn't mention are appended in their own order rather
    than dropped: a slice written after the playlist was last flushed is still
    part of the lesson.
    """
    if not playlist_text:
        return list(available_keys)

    by_name = {}
    for key in available_keys:
        by_name.setdefault(key.rsplit("/", 1)[-1], key)

    ordered = []
    for line in str(playlist_text).splitlines():
        name = line.strip()
        if not name or name.startswith(PLAYLIST_COMMENT):
            continue
        # A playlist may name a slice by a relative path.
        key = by_name.get(name.rsplit("/", 1)[-1])
        if key and key not in ordered:
            ordered.append(key)

    ordered.extend(key for key in available_keys if key not in ordered)
    return ordered


def parse_vtt(text):
    """The cues in one WebVTT document, in file order.

    Tolerant on purpose: the header, byte-order mark, `X-TIMESTAMP-MAP`,
    `NOTE`/`STYLE`/`REGION` blocks, cue identifiers and blank lines are all
    skipped, and a cue whose text spans several lines is joined into one. A
    file that is not VTT at all simply yields nothing.
    """
    if not text:
        return []

    cues = []
    pending = []
    collecting = False
    skipping_block = False

    for raw_line in str(text).replace("﻿", "").splitlines():
        line = raw_line.strip()

        if not line:
            # A blank line ends a cue, and ends a NOTE/STYLE/REGION block.
            if collecting and pending:
                cues.append(_cue_from(pending))
            pending = []
            collecting = False
            skipping_block = False
            continue

        if skipping_block:
            continue

        if TIMING_LINE.match(line):
            # Anything gathered before the timings was a cue identifier.
            pending = []
            collecting = True
            continue

        if collecting:
            pending.append(line)
            continue

        if line.split()[0] in BLOCK_KEYWORDS:
            skipping_block = True
            continue

        # The `WEBVTT` header, an `X-TIMESTAMP-MAP`, or a cue identifier on
        # the line before its timings. None of them is speech.

    if collecting and pending:
        cues.append(_cue_from(pending))

    return [cue for cue in cues if cue.text]


def _cue_from(lines):
    """One cue's payload lines, as a speaker and a line of text."""
    body = " ".join(lines).strip()

    speaker = ""
    match = VOICE_SPAN.match(body)
    if match:
        # `<v Teacher.loud>` carries classes after the name; only the name is
        # a person.
        speaker = match.group(1).strip().split(".")[0].strip()
        body = match.group(2)

    body = INLINE_TAG.sub("", body)
    # WebVTT escapes these four, and nothing downstream renders HTML.
    for entity, char in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&nbsp;", " ")):
        body = body.replace(entity, char)

    return Cue(speaker, " ".join(body.split()))


def _drop_superseded(cues):
    """Collapses a run of interim captions into the finished one.

    A cue that the next cue (from the same speaker) merely extends was a
    partial transcription of the same words, so only the longest survives.
    Compared case-insensitively on a letters-and-digits-only form, because the
    refinement usually adds punctuation and capitalisation as well as words.
    """
    kept = []
    for cue in cues:
        if kept:
            previous = kept[-1]
            if previous.speaker == cue.speaker:
                before = _comparable(previous.text)
                after = _comparable(cue.text)
                if before and after.startswith(before):
                    kept[-1] = cue
                    continue
                if before == after:
                    continue
        kept.append(cue)
    return kept


def _comparable(text):
    return re.sub(r"[^a-z0-9]+", "", str(text).lower())


def build_transcript(cues, *, speaker_names=None):
    """The cues as the lines a reader — and the model — actually sees.

    `speaker_names` maps the label in a `<v>` tag (Agora puts the channel uid
    there) to a person's name. A label with nobody behind it is kept as it
    came rather than invented around: "Participant 4071" is honest, and a
    wrong name against a quote is worse than no name.

    Consecutive cues from one speaker are joined into a paragraph, because a
    page of one-line turns reads as an argument rather than as a lesson.
    """
    names = speaker_names or {}
    lines = []

    for cue in _drop_superseded(cues):
        speaker = cue.speaker
        if speaker:
            speaker = names.get(speaker, names.get(str(speaker), speaker))

        if lines and lines[-1][0] == speaker:
            lines[-1][1].append(cue.text)
        else:
            lines.append((speaker, [cue.text]))

    rendered = []
    for speaker, parts in lines:
        body = " ".join(parts).strip()
        if not body:
            continue
        rendered.append(f"{speaker}: {body}" if speaker else body)

    return "\n".join(rendered)


def transcript_from_slices(slices, *, speaker_names=None):
    """The whole thing: `[(key, text), ...]` in order, one transcript out.

    A slice that cannot be parsed is logged and skipped rather than failing
    the class's notes — one malformed file is not worth an hour of teaching.
    """
    cues = []
    for key, text in slices:
        try:
            cues.extend(parse_vtt(text))
        except Exception:  # noqa: BLE001 - one bad slice must not lose the rest
            logger.exception("class_sessions: could not parse the caption slice %s", key)

    return build_transcript(cues, speaker_names=speaker_names)
