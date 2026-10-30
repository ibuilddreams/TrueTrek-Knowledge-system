"""The one Netless REST call the whiteboard needs: creating a room.

A whiteboard room cannot be signed into existence the way a token can — its
uuid is minted by Netless and has to be asked for over HTTP, once per class,
and then remembered (`ClassSession.whiteboard_room_uuid`). Everything else the
feature does is local: the room token each browser joins with is signed in
`whiteboard.py` without touching the network, so this module is on the path of
a class's *first* whiteboard open and of nothing else.

Keeping it to one call is deliberate. Netless also offers room listing, room
banning and document conversion; none of them is wired up, because each would
put a third-party request in front of an action a teacher takes mid-class, and
the one above is already the only place a live class can be held up by
somebody else's uptime.
"""

import logging

import requests

from .exceptions import WhiteboardUnavailableError

logger = logging.getLogger(__name__)

API_BASE_URL = "https://api.netless.link/v5"

# A teacher is watching a spinner while this runs, so it fails fast rather
# than retrying a slow response with the same timeout again — the same
# judgement `advisor.services.CHAT_TIMEOUT_SECONDS` makes, and the opposite of
# the backgrounded thread-and-poll work in `ai_courses` and `brand_validator`,
# which nobody is waiting on.
REQUEST_TIMEOUT_SECONDS = 10

# Netless's cap on how many `writer`/`admin` participants a room admits at
# once. 0 means no cap, which is what their documentation recommends and what
# a class needs: the teacher plus, when the board is opened up, every student
# in it. Readers are never counted against it.
NO_WRITER_LIMIT = 0


def create_room(*, sdk_token, region, limit=NO_WRITER_LIMIT, session=None):
    """Creates one whiteboard room and returns its uuid.

    `session` is a `requests`-compatible object, present only so tests can
    stand in for the network — the same seam `ai_courses.providers.custom_llm`
    uses.

    Every failure, whatever its shape, becomes `WhiteboardUnavailableError`
    with a sentence safe to show a teacher: Netless's own error bodies quote
    internal codes, and the detail belongs in the log rather than on a
    classroom screen.
    """
    http = session or requests
    url = f"{API_BASE_URL}/rooms"

    try:
        response = http.post(
            url,
            # Netless takes the credential in a bare `token` header rather
            # than in `Authorization`, and the region in a header too — it is
            # routing, not a body field, and a room created in one region is
            # invisible from another.
            headers={
                "token": sdk_token,
                "region": region,
                "Content-Type": "application/json",
            },
            json={"isRecord": False, "limit": limit},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        logger.exception("class_sessions: could not reach the whiteboard service at %s", url)
        raise WhiteboardUnavailableError(
            "The whiteboard service didn't respond. Try opening the board again in a moment."
        ) from exc

    if response.status_code >= 400:
        # Logged in full — a 401 here means the Access Key and Secret Key
        # don't belong to the App Identifier beside them, which is otherwise
        # indistinguishable from any other failure from the outside.
        logger.error(
            "class_sessions: whiteboard room creation failed (%s): %s",
            response.status_code,
            response.text[:500],
        )
        raise WhiteboardUnavailableError(
            "The whiteboard service rejected this request. Ask an administrator to "
            "check the whiteboard credentials."
        )

    try:
        payload = response.json()
    except ValueError as exc:
        logger.error("class_sessions: whiteboard room creation returned non-JSON: %s", response.text[:500])
        raise WhiteboardUnavailableError("The whiteboard service returned an unreadable reply.") from exc

    room_uuid = (payload or {}).get("uuid")
    if not room_uuid:
        logger.error("class_sessions: whiteboard room creation returned no uuid: %s", payload)
        raise WhiteboardUnavailableError("The whiteboard service didn't return a room.")

    logger.info("class_sessions: created whiteboard room %s in region %s", room_uuid, region)
    return room_uuid
