"""Agora Interactive Whiteboard credentials — signing (and reading back) a Netless token.

The whiteboard a teacher presents on during a live class runs on Agora's
Interactive Whiteboard, which is the Netless service: a different product from
Agora RTC with a different console section, its own credentials and its own
token format. `agora.py` signs the *video* token for the same class; nothing
here is interchangeable with it.

Three credentials come out of the console's Whiteboard section and all three
are needed:

* an **App Identifier**, which identifies the whiteboard app and is handed to
  the browser (`services.issue_whiteboard_credentials`) — public by design,
  exactly like the RTC App ID;
* an **Access Key (AK)** and a **Secret Key (SK)**, which are the signing
  secret and never leave this process.

Tokens come in three flavours, distinguished only by their prefix and by what
is inside: an **SDK token** (`NETLESSSDK_`) authenticates *us* to Netless's
REST API so a room can be created, a **room token** (`NETLESSROOM_`) lets one
browser into one room at one role, and a **task token** (`NETLESSTASK_`)
belongs to the document-conversion API we don't use. All three are written out
longhand here rather than pulled in as a dependency, for the same reason
`agora.py` is: Netless publishes its generators as sample source per language
(github.com/netless-io/netless-token) rather than as a maintained Python
package, and the whole of the format is the few lines below:

    prefix + urlsafe_b64_nopad( urlencode(sorted({**content, ak, nonce,
                                                   expireAt, sig})) )

where `sig` is HMAC-SHA256, hex, over the **compact, key-sorted JSON** of the
same fields *without* `sig`. The two serialisations are the detail of this
format most easily got wrong: what is signed is JSON, what is transmitted is a
query string, and signing the query string — the obvious reading — produces a
token Netless rejects as a bad signature with nothing to say about why.

`expireAt` is an **absolute Unix timestamp in milliseconds**, which is the
other easy mistake: it is the opposite convention to the RTC token next door,
whose every expiry is relative seconds from its issue time.
"""

import base64
import hmac
import json
import logging
import time
import urllib.parse
import uuid
from hashlib import sha256

logger = logging.getLogger(__name__)

SDK_TOKEN_PREFIX = "NETLESSSDK_"
ROOM_TOKEN_PREFIX = "NETLESSROOM_"
TASK_TOKEN_PREFIX = "NETLESSTASK_"

# Netless roles, smallest number being the most privileged. `admin` can create
# and ban rooms and mint any token; `writer` may draw; `reader` may only watch.
ROLE_ADMIN = "0"
ROLE_WRITER = "1"
ROLE_READER = "2"

ROLE_NAMES = {ROLE_ADMIN: "admin", ROLE_WRITER: "writer", ROLE_READER: "reader"}

# The data centres Netless publishes for the Interactive Whiteboard. A room
# lives in exactly one of them, and a browser that joins against a different
# one simply never finds it, so the region a room was created in is stored
# beside its uuid rather than read from settings at join time
# (`ClassSession.whiteboard_region`).
WHITEBOARD_REGIONS = {
    "us-sv": "Silicon Valley, United States",
    "sg": "Singapore",
    "in-mum": "Mumbai, India",
    "eu": "Frankfurt, Europe",
    "cn-hz": "Hangzhou, China",
}
DEFAULT_WHITEBOARD_REGION = "us-sv"

# Netless documents no ceiling on a token's lifetime, but a credential that
# outlives the class it was minted for is a credential that can be passed on
# afterwards, so the same 24-hour ceiling the RTC token is held to applies
# here. A lifespan of 0 would mean "never expires" and is deliberately not
# reachable through this module.
MAX_LIFESPAN_SECONDS = 24 * 60 * 60


class WhiteboardTokenError(ValueError):
    """A token could not be signed — bad credentials or bad arguments.

    Always a configuration or programming fault (an empty Access Key, an
    unknown role), never something a request can cause on its own, so callers
    turn it into a generic "not configured" message rather than showing it to
    a student. Mirrors `agora.AgoraTokenError`.
    """


# ---------------------------------------------------------------------------
# Serialisation primitives
# ---------------------------------------------------------------------------

# JavaScript's `encodeURIComponent`, which the reference generators use, leaves
# these characters alone on top of the unreserved set Python already keeps.
# Nothing we put in a token today contains any of them — a role is one digit, a
# uuid is hex and a nonce is a uuid — but matching the reference byte for byte
# is what makes this module checkable against it rather than merely plausible.
_URI_COMPONENT_SAFE = "!~*'()"


def _encode_uri_component(value):
    return urllib.parse.quote(str(value), safe=_URI_COMPONENT_SAFE)


def _query_string(fields):
    """The transmitted form: `a=1&b=2`, keys sorted.

    Sorted for the same reason `agora._pack_privileges` sorts: a dict's
    insertion order must never decide what a credential looks like, or the
    same inputs stop producing the same token and nothing can be pinned by a
    test. Netless parses this as a query string and does not care about the
    order, so sorting costs nothing.
    """
    return "&".join(
        f"{_encode_uri_component(key)}={_encode_uri_component(fields[key])}"
        for key in sorted(fields)
    )


def _signing_payload(fields):
    """The signed form: compact JSON, keys sorted, every value a string.

    `separators` is what makes it compact — `json.dumps` writes `", "` and
    `": "` by default, and those two spaces are the difference between a
    signature Netless accepts and one it rejects.
    """
    return json.dumps(
        {key: str(value) for key, value in fields.items()},
        sort_keys=True,
        separators=(",", ":"),
    )


def _base64_no_padding(raw):
    """URL-safe base64 with the `=` padding stripped, as the reference does."""
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _base64_with_padding(encoded):
    """The inverse — `base64` refuses to decode a string it can't pad."""
    return base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))


# ---------------------------------------------------------------------------
# Signing
# ---------------------------------------------------------------------------


def _build_token(
    prefix,
    *,
    access_key,
    secret_key,
    lifespan_seconds,
    content,
    nonce=None,
    issued_at_ms=None,
):
    """Signs one token of any flavour.

    `lifespan_seconds` is a duration from now; it is converted to the absolute
    millisecond `expireAt` the format actually carries. `nonce` and
    `issued_at_ms` exist only so tests can pin a token to known bytes —
    production always takes a fresh uuid and the clock.
    """
    if not isinstance(access_key, str) or not access_key.strip():
        raise WhiteboardTokenError("A whiteboard Access Key is required.")
    if not isinstance(secret_key, str) or not secret_key.strip():
        raise WhiteboardTokenError("A whiteboard Secret Key is required.")
    if not isinstance(lifespan_seconds, int) or not 1 <= lifespan_seconds <= MAX_LIFESPAN_SECONDS:
        raise WhiteboardTokenError(
            f"A token's lifetime must be between 1 and {MAX_LIFESPAN_SECONDS} seconds."
        )
    if content.get("role") not in ROLE_NAMES:
        raise WhiteboardTokenError("Unknown whiteboard role.")

    issued_at_ms = int(issued_at_ms if issued_at_ms is not None else time.time() * 1000)
    # uuid4 rather than the reference generators' uuid1: this value only has
    # to be unique, and uuid1 spends a MAC address and a timestamp to achieve
    # that. Netless treats it as an opaque string.
    nonce = str(nonce if nonce is not None else uuid.uuid4())

    fields = {
        **content,
        "ak": access_key,
        "nonce": nonce,
        "expireAt": str(issued_at_ms + lifespan_seconds * 1000),
    }

    signature = hmac.new(
        secret_key.encode("utf-8"), _signing_payload(fields).encode("utf-8"), sha256
    ).hexdigest()

    return prefix + _base64_no_padding(
        _query_string({**fields, "sig": signature}).encode("utf-8")
    )


def build_sdk_token(*, access_key, secret_key, lifespan_seconds, role=ROLE_ADMIN, **pinned):
    """Authenticates *this server* to the Netless REST API.

    Never sent to a browser: it is the credential that creates rooms, so it
    carries the whole team's authority rather than one room's. `role` is
    `admin` because creating a room and minting a reader's room token for it
    both need admin — a `writer` SDK token can do neither.
    """
    return _build_token(
        SDK_TOKEN_PREFIX,
        access_key=access_key,
        secret_key=secret_key,
        lifespan_seconds=lifespan_seconds,
        content={"role": role},
        **pinned,
    )


def build_room_token(*, access_key, secret_key, lifespan_seconds, room_uuid, role, **pinned):
    """Lets one browser into one room, at one role.

    This is the only whiteboard credential that reaches a student, and it is
    bound to a single room uuid — handing it to somebody looking at a
    different class gets them nothing. The role is what the *server* enforces:
    a `reader` cannot draw however the page is persuaded to behave, which is
    why "students may draw" is a token decision rather than a UI one
    (`services.issue_whiteboard_credentials`).
    """
    if not room_uuid:
        raise WhiteboardTokenError("A room uuid is required.")
    return _build_token(
        ROOM_TOKEN_PREFIX,
        access_key=access_key,
        secret_key=secret_key,
        lifespan_seconds=lifespan_seconds,
        content={"role": role, "uuid": room_uuid},
        **pinned,
    )


def build_task_token(*, access_key, secret_key, lifespan_seconds, task_uuid, role, **pinned):
    """For Netless's document-conversion API.

    Nothing calls this: converting a PDF or a slide deck into whiteboard
    scenes is a feature we have deliberately not built (see
    `services.ensure_whiteboard_room`). It is here because the three token
    flavours are one format with three prefixes, and leaving one out would
    invite the next person to re-derive the whole thing.
    """
    if not task_uuid:
        raise WhiteboardTokenError("A task uuid is required.")
    return _build_token(
        TASK_TOKEN_PREFIX,
        access_key=access_key,
        secret_key=secret_key,
        lifespan_seconds=lifespan_seconds,
        content={"role": role, "uuid": task_uuid},
        **pinned,
    )


# ---------------------------------------------------------------------------
# Reading one back
# ---------------------------------------------------------------------------


def decode_token(token, secret_key=None):
    """Reads a token back into its fields — the inverse of `_build_token`.

    Nothing in the request path calls this; Netless is the only party that
    validates a token. It exists for the same two reasons
    `agora.decode_rtc_token` does: so the tests can assert on what was
    actually signed rather than comparing one opaque string to another, and so
    a support question about a rejected token can be answered from a shell.
    Given the Secret Key it also re-checks the signature, which is the single
    thing a format drift would break.
    """
    if not isinstance(token, str):
        raise WhiteboardTokenError("Not a Netless token.")

    prefix = next(
        (p for p in (SDK_TOKEN_PREFIX, ROOM_TOKEN_PREFIX, TASK_TOKEN_PREFIX) if token.startswith(p)),
        None,
    )
    if prefix is None:
        raise WhiteboardTokenError("Not a Netless token.")

    try:
        query = _base64_with_padding(token[len(prefix) :]).decode("utf-8")
    except (ValueError, UnicodeDecodeError) as exc:
        raise WhiteboardTokenError("Token payload is not readable.") from exc

    fields = dict(urllib.parse.parse_qsl(query, keep_blank_values=True))
    signature = fields.pop("sig", None)

    decoded = {
        "prefix": prefix,
        "access_key": fields.get("ak", ""),
        "nonce": fields.get("nonce", ""),
        "role": fields.get("role", ""),
        "role_name": ROLE_NAMES.get(fields.get("role", ""), ""),
        "uuid": fields.get("uuid", ""),
        # Milliseconds on the wire; seconds is what every other expiry in this
        # codebase is measured in, so both are offered and neither is guessed at.
        "expire_at_ms": int(fields["expireAt"]) if fields.get("expireAt") else None,
        "signature": signature,
        "signature_valid": None,
    }

    if secret_key is not None and signature is not None:
        expected = hmac.new(
            secret_key.encode("utf-8"), _signing_payload(fields).encode("utf-8"), sha256
        ).hexdigest()
        decoded["signature_valid"] = hmac.compare_digest(expected, signature)

    return decoded
