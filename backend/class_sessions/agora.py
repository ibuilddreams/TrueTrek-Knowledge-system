"""Agora RTC credentials — signing (and reading back) an AccessToken2.

A client may only join an Agora channel with a token signed by the project's
App Certificate, which is a server-side secret: it never leaves this process,
and the browser receives only the short-lived token this module mints (see
`services.issue_join_credentials`).

The format implemented here is Agora's **AccessToken2**, the current token
version, recognisable by its `007` prefix. It is written out longhand rather
than pulled in as a dependency on purpose: the only Python package on PyPI
(`agora-token-builder`) still emits the superseded `006` format, and Agora
publishes AccessToken2 as sample source rather than a package. The wire format
below is the whole of it — a length-prefixed, little-endian struct, deflated
and base64'd, with an HMAC-SHA256 signature over the same bytes:

    "007" + b64(zlib(   str(signature)
                      + str(app_id) + u32(issued_at) + u32(expire)
                      + u32(salt) + u16(service_count)
                      + u16(service_type) + privileges
                      + str(channel_name) + str(uid) ))

where `str(x)` is a uint16 length followed by the raw bytes, privileges are a
uint16 count followed by (uint16 id, uint32 seconds) pairs in ascending id
order, and the signing key is the App Certificate chained through the issue
timestamp and the salt. `decode_rtc_token` reverses exactly that and is what
the tests check a freshly minted token against, so a drift in either direction
fails loudly here rather than as an unexplained 110/109 error in a browser.

Every expiry in a token is **relative seconds from `issued_at`**, not an
absolute timestamp — the one detail of this format that is easiest to get
wrong, since the rest of the struct is absolute.
"""

import base64
import hmac
import secrets
import struct
import time
import zlib
from hashlib import sha256

TOKEN_VERSION = "007"

SERVICE_TYPE_RTC = 1

PRIVILEGE_JOIN_CHANNEL = 1
PRIVILEGE_PUBLISH_AUDIO_STREAM = 2
PRIVILEGE_PUBLISH_VIDEO_STREAM = 3
PRIVILEGE_PUBLISH_DATA_STREAM = 4

# A publisher may send audio/video/data; a subscriber may only receive. Note
# that the publish privileges are enforced by Agora only when the project has
# co-host authentication switched on — the role is still issued honestly so
# turning that setting on later needs no change here.
ROLE_PUBLISHER = 1
ROLE_SUBSCRIBER = 2

# Agora rejects a privilege valid for more than 24 hours.
MAX_EXPIRE_SECONDS = 24 * 60 * 60

_UINT32_MAX = 2**32 - 1


class AgoraTokenError(ValueError):
    """A token could not be signed — bad credentials or bad arguments.

    Always a programming/configuration fault (a malformed App ID, an out of
    range uid), never something a request can cause on its own, so callers
    translate it into a 500-shaped "not configured" message rather than
    showing it to a student.
    """


# ---------------------------------------------------------------------------
# Packing primitives — little-endian, matching Agora's wire format exactly.
# ---------------------------------------------------------------------------


def _pack_uint16(value):
    return struct.pack("<H", value)


def _pack_uint32(value):
    return struct.pack("<I", value)


def _pack_string(value):
    if isinstance(value, str):
        value = value.encode("utf-8")
    return _pack_uint16(len(value)) + value


def _unpack_uint16(buffer):
    return struct.unpack("<H", buffer[:2])[0], buffer[2:]


def _unpack_uint32(buffer):
    return struct.unpack("<I", buffer[:4])[0], buffer[4:]


def _unpack_string(buffer):
    length, buffer = _unpack_uint16(buffer)
    return buffer[:length], buffer[length:]


def _pack_privileges(privileges):
    """Privileges are written in ascending id order — the signature is over
    these bytes, so a dict's insertion order must not leak into them."""
    items = sorted(privileges.items())
    return _pack_uint16(len(items)) + b"".join(
        _pack_uint16(key) + _pack_uint32(value) for key, value in items
    )


def _is_hex32(value):
    """An App ID and an App Certificate are both 32 hex characters."""
    if not isinstance(value, str) or len(value) != 32:
        return False
    try:
        bytes.fromhex(value)
    except ValueError:
        return False
    return True


def _signing_key(app_certificate, issued_at, salt):
    key = hmac.new(_pack_uint32(issued_at), app_certificate.encode("utf-8"), sha256).digest()
    return hmac.new(_pack_uint32(salt), key, sha256).digest()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def build_rtc_token(
    *,
    app_id,
    app_certificate,
    channel_name,
    uid,
    expire_seconds,
    role=ROLE_PUBLISHER,
    issued_at=None,
    salt=None,
):
    """Signs a join token for one user on one channel.

    `expire_seconds` is a duration, not a deadline: it covers both how long
    the token may be presented and how long the privileges inside it last.
    `issued_at` and `salt` exist only so tests can pin a token to known bytes;
    production always takes the clock and a fresh CSPRNG salt.
    """
    if not _is_hex32(app_id):
        raise AgoraTokenError("Agora App ID must be 32 hexadecimal characters.")
    if not _is_hex32(app_certificate):
        raise AgoraTokenError("Agora App Certificate must be 32 hexadecimal characters.")
    if not channel_name:
        raise AgoraTokenError("A channel name is required.")
    if not isinstance(uid, int) or isinstance(uid, bool) or not 0 <= uid <= _UINT32_MAX:
        raise AgoraTokenError("An Agora uid must be an integer between 0 and 2^32-1.")
    if not isinstance(expire_seconds, int) or not 1 <= expire_seconds <= MAX_EXPIRE_SECONDS:
        raise AgoraTokenError(
            f"A token's lifetime must be between 1 and {MAX_EXPIRE_SECONDS} seconds."
        )
    if role not in (ROLE_PUBLISHER, ROLE_SUBSCRIBER):
        raise AgoraTokenError("Unknown Agora role.")

    issued_at = int(issued_at if issued_at is not None else time.time())
    salt = int(salt if salt is not None else secrets.SystemRandom().randint(1, 99999999))

    privileges = {PRIVILEGE_JOIN_CHANNEL: expire_seconds}
    if role == ROLE_PUBLISHER:
        privileges[PRIVILEGE_PUBLISH_AUDIO_STREAM] = expire_seconds
        privileges[PRIVILEGE_PUBLISH_VIDEO_STREAM] = expire_seconds
        privileges[PRIVILEGE_PUBLISH_DATA_STREAM] = expire_seconds

    # uid 0 means "let Agora assign one", and is written as an empty string.
    packed_uid = b"" if uid == 0 else str(uid).encode("utf-8")
    service = (
        _pack_uint16(SERVICE_TYPE_RTC)
        + _pack_privileges(privileges)
        + _pack_string(channel_name)
        + _pack_string(packed_uid)
    )

    signing_info = (
        _pack_string(app_id)
        + _pack_uint32(issued_at)
        + _pack_uint32(expire_seconds)
        + _pack_uint32(salt)
        + _pack_uint16(1)  # one service: RTC
        + service
    )

    signature = hmac.new(
        _signing_key(app_certificate, issued_at, salt), signing_info, sha256
    ).digest()

    payload = zlib.compress(_pack_string(signature) + signing_info)
    return TOKEN_VERSION + base64.b64encode(payload).decode("utf-8")


def decode_rtc_token(token, app_certificate=None):
    """Reads a token back into its fields — the inverse of `build_rtc_token`.

    Nothing in the request path calls this: Agora is the only party that needs
    to validate a token. It exists so the tests can assert on what was
    actually signed (and, given the certificate, that the signature verifies)
    instead of comparing one opaque string to another, and so a support
    question about a rejected token can be answered from a shell.
    """
    if not isinstance(token, str) or not token.startswith(TOKEN_VERSION):
        raise AgoraTokenError("Not an AccessToken2 (007) token.")

    try:
        buffer = zlib.decompress(base64.b64decode(token[len(TOKEN_VERSION) :]))
    except (ValueError, zlib.error) as exc:
        raise AgoraTokenError("Token payload is not readable.") from exc

    signature, signing_info = _unpack_string(buffer)
    rest = signing_info
    app_id, rest = _unpack_string(rest)
    issued_at, rest = _unpack_uint32(rest)
    expire_seconds, rest = _unpack_uint32(rest)
    salt, rest = _unpack_uint32(rest)
    service_count, rest = _unpack_uint16(rest)

    service_type, rest = _unpack_uint16(rest)
    privilege_count, rest = _unpack_uint16(rest)
    privileges = {}
    for _ in range(privilege_count):
        privilege_id, rest = _unpack_uint16(rest)
        privilege_expire, rest = _unpack_uint32(rest)
        privileges[privilege_id] = privilege_expire
    channel_name, rest = _unpack_string(rest)
    uid, rest = _unpack_string(rest)

    decoded = {
        "app_id": app_id.decode("utf-8"),
        "issued_at": issued_at,
        "expire_seconds": expire_seconds,
        "salt": salt,
        "service_count": service_count,
        "service_type": service_type,
        "privileges": privileges,
        "channel_name": channel_name.decode("utf-8"),
        "uid": int(uid) if uid else 0,
        "signature_valid": None,
    }

    if app_certificate is not None:
        expected = hmac.new(
            _signing_key(app_certificate, issued_at, salt), signing_info, sha256
        ).digest()
        decoded["signature_valid"] = hmac.compare_digest(expected, signature)

    return decoded
