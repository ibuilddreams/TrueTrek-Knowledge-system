"""What a browser is allowed to hand this server as a class's audio.

Small, and entirely about one thing that is easy to get wrong: the media type
a `MediaRecorder` produces is **not** the media type an AI model accepts, and
the mismatch fails as an unhelpful 400 from the model rather than as anything
the teacher could act on.

Two specific traps, both of which this module exists to close:

* A browser reports its recording as `audio/webm;codecs=opus`. The parameter
  is part of the header, not part of the type, and a model that reads
  `webm;codecs=opus` as the subtype rejects the request outright. The
  parameters are stripped before anything is sent.

* Safari records `audio/mp4`, which is an AAC stream in an MP4 container and
  is not one of the audio types the model names. It is sent as `audio/aac`,
  which is what is actually inside it.

Anything not on the list is refused at the door rather than stored and found
unreadable twenty minutes later, when the class is over and the teacher has
gone home.
"""

# Browser type (already lower-cased and stripped of parameters) → the type the
# AI model is told it is reading, and the extension the file is stored under.
#
# The keys are what `MediaRecorder.isTypeSupported` actually returns across
# Chrome/Edge (webm), Firefox (webm, ogg) and Safari (mp4); the rest are here
# because a future client, or a teacher re-uploading something by hand, may
# reasonably send them.
_AUDIO_TYPES = {
    "audio/webm": ("audio/webm", "webm"),
    "audio/ogg": ("audio/ogg", "ogg"),
    "audio/opus": ("audio/ogg", "ogg"),
    "audio/mp4": ("audio/aac", "m4a"),
    "audio/x-m4a": ("audio/aac", "m4a"),
    "audio/aac": ("audio/aac", "aac"),
    "audio/mpeg": ("audio/mp3", "mp3"),
    "audio/mp3": ("audio/mp3", "mp3"),
    "audio/wav": ("audio/wav", "wav"),
    "audio/x-wav": ("audio/wav", "wav"),
    "audio/wave": ("audio/wav", "wav"),
    "audio/flac": ("audio/flac", "flac"),
    "audio/x-flac": ("audio/flac", "flac"),
}

# The order a browser is asked to try. First supported wins, so Chrome, Edge
# and Firefox record Opus in WebM and Safari falls through to MP4. Sent to the
# browser by `services.notes_capture_config` rather than hard-coded there, so
# the allowed list and the preferred list cannot drift apart.
PREFERRED_RECORDING_TYPES = (
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
)

#: A blob smaller than this carries no audio worth a model call — an empty
#: container header and nothing else, which is what a recorder stopped in the
#: same second it started produces.
MIN_SEGMENT_BYTES = 1024


class UnsupportedAudioError(ValueError):
    """The browser sent something no model here can read."""


def base_type(raw):
    """`audio/webm;codecs=opus` → `audio/webm`. Never raises."""
    return str(raw or "").split(";")[0].strip().lower()


def resolve(raw):
    """(type to send the model, file extension) for a browser's media type.

    Raises `UnsupportedAudioError` with a sentence a teacher can read, because
    this is reached from an upload the classroom is waiting on rather than
    from a background thread.
    """
    resolved = _AUDIO_TYPES.get(base_type(raw))
    if resolved is None:
        raise UnsupportedAudioError(
            "This browser recorded the class in a format the notes can't be "
            "written from. Chrome, Edge, Firefox and Safari are all supported."
        )
    return resolved


def is_supported(raw):
    return base_type(raw) in _AUDIO_TYPES
