"""What a Netless whiteboard token is made of, pinned.

A whiteboard token is as opaque as an RTC one and is rejected just as
wordlessly, so the same approach `test_agora.py` takes applies: pin the format
against whatever its publisher actually published, and reverse the token to
assert on the fields rather than on one base64 string.

Netless publishes no end-to-end token fixtures — its own Go suite only checks
that a token starts with the right prefix — but it does publish vectors for
the two steps a drift would break (`golang/token_test.go` in
netless-io/netless-token): the HMAC-SHA256 hex digest, and the unpadded
url-safe base64. Both are pinned below, and the canonical signing string —
compact, key-sorted JSON rather than the query string that is transmitted — is
pinned beside them, because signing the wrong one of those two is the mistake
this format invites and the only symptom is "invalid signature".
"""

import base64
import hmac
import json
from hashlib import sha256

from django.test import SimpleTestCase

from ..whiteboard import (
    MAX_LIFESPAN_SECONDS,
    ROOM_TOKEN_PREFIX,
    ROLE_ADMIN,
    ROLE_READER,
    ROLE_WRITER,
    SDK_TOKEN_PREFIX,
    TASK_TOKEN_PREFIX,
    WhiteboardTokenError,
    _base64_no_padding,
    _signing_payload,
    build_room_token,
    build_sdk_token,
    build_task_token,
    decode_token,
)

ACCESS_KEY = "k1Qw2Zr9Ab3Cd4Ef"
SECRET_KEY = "s7Xy8Wv6Ut5Sr4Qp3On2Ml1Kj0Ih9Gf"
ROOM_UUID = "5a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d"

# Pinned so a token is reproducible; production takes a fresh uuid and the
# clock (`whiteboard._build_token`).
NONCE = "11111111-2222-3333-4444-555555555555"
ISSUED_AT_MS = 1_700_000_000_000
LIFESPAN_SECONDS = 3600


def _fixed(builder, **kwargs):
    return builder(
        access_key=ACCESS_KEY,
        secret_key=SECRET_KEY,
        lifespan_seconds=LIFESPAN_SECONDS,
        nonce=NONCE,
        issued_at_ms=ISSUED_AT_MS,
        **kwargs,
    )


class PublishedVectorTests(SimpleTestCase):
    """The two primitives netless-token publishes test vectors for."""

    def test_hmac_sha256_hex_matches_netlesss_published_vector(self):
        # golang/token_test.go: hmac256("netless", "key") == "4b0072…"
        digest = hmac.new(b"key", b"netless", sha256).hexdigest()
        self.assertEqual(
            digest, "4b007294b9ebeccb96fb1ef30c843b9894d6323375e042b1ef2775978225ca7f"
        )

    def test_base64_matches_netlesss_published_vector(self):
        # golang/token_test.go: bufferToBase64([]byte("netless")) == "bmV0bGVzcw"
        # — url-safe and with the "=" padding stripped, which is the half of
        # this step that is easy to leave in.
        self.assertEqual(_base64_no_padding(b"netless"), "bmV0bGVzcw")


class SigningStringTests(SimpleTestCase):
    """What is signed is JSON; what is sent is a query string."""

    def test_the_signed_payload_is_compact_key_sorted_json(self):
        payload = _signing_payload({"role": "1", "ak": "A", "nonce": "N", "expireAt": "9"})
        self.assertEqual(payload, '{"ak":"A","expireAt":"9","nonce":"N","role":"1"}')

    def test_the_signature_is_taken_over_that_json_and_not_over_the_query_string(self):
        token = _fixed(build_room_token, room_uuid=ROOM_UUID, role=ROLE_WRITER)
        fields = {
            "ak": ACCESS_KEY,
            "nonce": NONCE,
            "expireAt": str(ISSUED_AT_MS + LIFESPAN_SECONDS * 1000),
            "role": ROLE_WRITER,
            "uuid": ROOM_UUID,
        }
        expected = hmac.new(
            SECRET_KEY.encode(), _signing_payload(fields).encode(), sha256
        ).hexdigest()

        self.assertEqual(decode_token(token)["signature"], expected)

    def test_the_body_is_an_unpadded_url_safe_base64_query_string(self):
        token = _fixed(build_room_token, room_uuid=ROOM_UUID, role=ROLE_READER)
        body = token[len(ROOM_TOKEN_PREFIX) :]

        self.assertNotIn("=", body)
        self.assertNotIn("+", body)
        self.assertNotIn("/", body)

        decoded = base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)).decode()
        self.assertIn(f"uuid={ROOM_UUID}", decoded)
        self.assertIn("sig=", decoded)


class PrefixTests(SimpleTestCase):
    def test_each_flavour_carries_its_own_prefix(self):
        self.assertTrue(
            _fixed(build_sdk_token, role=ROLE_ADMIN).startswith(SDK_TOKEN_PREFIX)
        )
        self.assertTrue(
            _fixed(build_room_token, room_uuid=ROOM_UUID, role=ROLE_WRITER).startswith(
                ROOM_TOKEN_PREFIX
            )
        )
        self.assertTrue(
            _fixed(build_task_token, task_uuid=ROOM_UUID, role=ROLE_READER).startswith(
                TASK_TOKEN_PREFIX
            )
        )


class RoundTripTests(SimpleTestCase):
    def test_a_room_token_decodes_to_what_was_signed(self):
        token = _fixed(build_room_token, room_uuid=ROOM_UUID, role=ROLE_WRITER)
        decoded = decode_token(token, SECRET_KEY)

        self.assertEqual(decoded["prefix"], ROOM_TOKEN_PREFIX)
        self.assertEqual(decoded["access_key"], ACCESS_KEY)
        self.assertEqual(decoded["nonce"], NONCE)
        self.assertEqual(decoded["role"], ROLE_WRITER)
        self.assertEqual(decoded["role_name"], "writer")
        self.assertEqual(decoded["uuid"], ROOM_UUID)
        self.assertTrue(decoded["signature_valid"])

    def test_expiry_is_an_absolute_millisecond_timestamp_not_a_duration(self):
        # The opposite convention to the RTC token next door, which carries
        # relative seconds — getting these the wrong way round yields a token
        # that expired in 1970 or one good for fifty years.
        token = _fixed(build_sdk_token, role=ROLE_ADMIN)
        decoded = decode_token(token)

        self.assertEqual(decoded["expire_at_ms"], ISSUED_AT_MS + LIFESPAN_SECONDS * 1000)

    def test_a_token_signed_with_another_secret_does_not_verify(self):
        token = _fixed(build_room_token, room_uuid=ROOM_UUID, role=ROLE_WRITER)
        self.assertFalse(decode_token(token, "a-different-secret")["signature_valid"])

    def test_tampering_with_the_role_breaks_the_signature(self):
        """The whole point of the format: a reader cannot promote themselves.

        A student's token says `role=2`, and the body is plain base64 anyone
        can edit — so this asserts that editing it is what Netless would
        reject, rather than something only our own code would catch.
        """
        token = _fixed(build_room_token, room_uuid=ROOM_UUID, role=ROLE_READER)
        body = token[len(ROOM_TOKEN_PREFIX) :]
        query = base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)).decode()
        tampered = ROOM_TOKEN_PREFIX + _base64_no_padding(
            query.replace(f"role={ROLE_READER}", f"role={ROLE_WRITER}").encode()
        )

        decoded = decode_token(tampered, SECRET_KEY)
        self.assertEqual(decoded["role"], ROLE_WRITER)
        self.assertFalse(decoded["signature_valid"])


class ValidationTests(SimpleTestCase):
    def test_a_missing_access_key_is_refused(self):
        with self.assertRaises(WhiteboardTokenError):
            build_sdk_token(
                access_key="", secret_key=SECRET_KEY, lifespan_seconds=60, role=ROLE_ADMIN
            )

    def test_a_missing_secret_key_is_refused(self):
        with self.assertRaises(WhiteboardTokenError):
            build_sdk_token(
                access_key=ACCESS_KEY, secret_key="   ", lifespan_seconds=60, role=ROLE_ADMIN
            )

    def test_an_unknown_role_is_refused(self):
        with self.assertRaises(WhiteboardTokenError):
            build_room_token(
                access_key=ACCESS_KEY,
                secret_key=SECRET_KEY,
                lifespan_seconds=60,
                room_uuid=ROOM_UUID,
                role="9",
            )

    def test_a_room_token_without_a_room_is_refused(self):
        with self.assertRaises(WhiteboardTokenError):
            build_room_token(
                access_key=ACCESS_KEY,
                secret_key=SECRET_KEY,
                lifespan_seconds=60,
                room_uuid="",
                role=ROLE_WRITER,
            )

    def test_a_never_expiring_token_cannot_be_asked_for(self):
        # Netless reads a lifespan of 0 as "never expires"; this module has no
        # way to express that, so a credential always has an end.
        with self.assertRaises(WhiteboardTokenError):
            build_sdk_token(
                access_key=ACCESS_KEY, secret_key=SECRET_KEY, lifespan_seconds=0, role=ROLE_ADMIN
            )

    def test_a_lifetime_beyond_the_ceiling_is_refused(self):
        with self.assertRaises(WhiteboardTokenError):
            build_sdk_token(
                access_key=ACCESS_KEY,
                secret_key=SECRET_KEY,
                lifespan_seconds=MAX_LIFESPAN_SECONDS + 1,
                role=ROLE_ADMIN,
            )

    def test_something_that_is_not_a_netless_token_is_refused(self):
        with self.assertRaises(WhiteboardTokenError):
            decode_token("007eJxTYBBbsMMnKq7p9Hf")

    def test_values_are_url_encoded_the_way_the_reference_generators_do(self):
        """`encodeURIComponent`, not `quote_plus`.

        Nothing we sign contains a character the two disagree about today — a
        role is a digit and a uuid is hex — so this pins the behaviour before
        a future field (a display name, say) makes the difference load-bearing
        and silently invalid.
        """
        from ..whiteboard import _encode_uri_component, _query_string

        self.assertEqual(_encode_uri_component("a b"), "a%20b")
        self.assertEqual(_encode_uri_component("a/b"), "a%2Fb")
        self.assertEqual(_encode_uri_component("a~b!c"), "a~b!c")
        self.assertEqual(_query_string({"b": "2", "a": "1"}), "a=1&b=2")

    def test_json_dumps_defaults_would_not_match(self):
        """Guards the `separators` argument, which looks removable.

        `json.dumps` writes ", " and ": " by default, and those two spaces are
        the whole difference between a signature Netless accepts and one it
        rejects without explanation.
        """
        fields = {"ak": "A", "role": "1"}
        self.assertNotEqual(json.dumps(fields, sort_keys=True), _signing_payload(fields))
