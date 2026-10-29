from django.test import SimpleTestCase

from ..agora import (
    MAX_EXPIRE_SECONDS,
    PRIVILEGE_JOIN_CHANNEL,
    PRIVILEGE_PUBLISH_AUDIO_STREAM,
    PRIVILEGE_PUBLISH_DATA_STREAM,
    PRIVILEGE_PUBLISH_VIDEO_STREAM,
    ROLE_PUBLISHER,
    ROLE_SUBSCRIBER,
    AgoraTokenError,
    build_rtc_token,
    decode_rtc_token,
)

# Agora's own published fixtures (python3/test/AccessToken2Test.py in
# AgoraIO/Tools), pinned here as the only check that actually matters: that
# the bytes we sign are the bytes Agora's servers expect. A token is opaque
# and is rejected with a bare error code, so without these vectors a format
# drift would first show up as a browser that cannot join a class.
VECTOR_APP_ID = "970CA35de60c44645bbae8a215061b33"
VECTOR_APP_CERTIFICATE = "5CFd2fd1755d40ecb72977518be15d3b"
VECTOR_CHANNEL = "7d72365eb983485397e3e3f9d460bdda"
VECTOR_ISSUED_AT = 1111111
VECTOR_SALT = 1
VECTOR_EXPIRE = 600

VECTOR_TOKEN_WITH_UID = (
    "007eJxTYBBbsMMnKq7p9Hf/HcIX5kce9b518kCiQgSr5Zrp4X1Tu6UUGCzNDZwdjU1TUs0Mkk1MzExMk5ISUy0SjQ"
    "xNDcwMk4yN3b8IMEQwMTAwMoAwBIL4CgzmKeZGxmamqUmWFsYmFqbGluapxqnGaZYpJmYGSSkpiVwMRhYWRsYmhk"
    "bmxgDCaiTj"
)
VECTOR_TOKEN_WITH_UID_0 = (
    "007eJxTYLhzZP08Lxa1Pg57+TcXb/3cZ3wi4V6kbpbOog0G2dOYk20UGCzNDZwdjU1TUs0Mkk1MzExMk5ISUy0Sj"
    "QxNDcwMk4yN3b8IMEQwMTAwMoAwBIL4CgzmKeZGxmamqUmWFsYmFqbGluapxqnGaZYpJmYGSSkpiQwMADacImo="
)


class OfficialVectorTests(SimpleTestCase):
    def test_matches_agoras_published_token_for_a_numeric_uid(self):
        token = build_rtc_token(
            app_id=VECTOR_APP_ID,
            app_certificate=VECTOR_APP_CERTIFICATE,
            channel_name=VECTOR_CHANNEL,
            uid=2882341273,
            expire_seconds=VECTOR_EXPIRE,
            role=ROLE_SUBSCRIBER,
            issued_at=VECTOR_ISSUED_AT,
            salt=VECTOR_SALT,
        )
        self.assertEqual(token, VECTOR_TOKEN_WITH_UID)

    def test_matches_agoras_published_token_for_uid_zero(self):
        token = build_rtc_token(
            app_id=VECTOR_APP_ID,
            app_certificate=VECTOR_APP_CERTIFICATE,
            channel_name=VECTOR_CHANNEL,
            uid=0,
            expire_seconds=VECTOR_EXPIRE,
            role=ROLE_SUBSCRIBER,
            issued_at=VECTOR_ISSUED_AT,
            salt=VECTOR_SALT,
        )
        self.assertEqual(token, VECTOR_TOKEN_WITH_UID_0)


class TokenContentTests(SimpleTestCase):
    def _token(self, **overrides):
        kwargs = {
            "app_id": VECTOR_APP_ID,
            "app_certificate": VECTOR_APP_CERTIFICATE,
            "channel_name": "cls-abcdef",
            "uid": 42,
            "expire_seconds": 3600,
        }
        kwargs.update(overrides)
        return build_rtc_token(**kwargs)

    def test_a_publisher_may_send_audio_video_and_data(self):
        decoded = decode_rtc_token(self._token(role=ROLE_PUBLISHER), VECTOR_APP_CERTIFICATE)

        self.assertEqual(
            set(decoded["privileges"]),
            {
                PRIVILEGE_JOIN_CHANNEL,
                PRIVILEGE_PUBLISH_AUDIO_STREAM,
                PRIVILEGE_PUBLISH_VIDEO_STREAM,
                PRIVILEGE_PUBLISH_DATA_STREAM,
            },
        )
        self.assertTrue(decoded["signature_valid"])

    def test_a_subscriber_may_only_join(self):
        decoded = decode_rtc_token(self._token(role=ROLE_SUBSCRIBER), VECTOR_APP_CERTIFICATE)
        self.assertEqual(set(decoded["privileges"]), {PRIVILEGE_JOIN_CHANNEL})

    def test_round_trips_the_channel_and_uid(self):
        decoded = decode_rtc_token(
            self._token(channel_name="cls-xyz", uid=99), VECTOR_APP_CERTIFICATE
        )
        self.assertEqual(decoded["channel_name"], "cls-xyz")
        self.assertEqual(decoded["uid"], 99)
        self.assertEqual(decoded["app_id"], VECTOR_APP_ID)
        self.assertEqual(decoded["service_count"], 1)

    def test_a_token_signed_with_another_certificate_does_not_verify(self):
        token = self._token(app_certificate="0" * 32)
        self.assertFalse(decode_rtc_token(token, VECTOR_APP_CERTIFICATE)["signature_valid"])

    def test_every_token_is_salted_differently(self):
        self.assertNotEqual(self._token(), self._token())


class TokenValidationTests(SimpleTestCase):
    def _build(self, **overrides):
        kwargs = {
            "app_id": VECTOR_APP_ID,
            "app_certificate": VECTOR_APP_CERTIFICATE,
            "channel_name": "cls-abcdef",
            "uid": 1,
            "expire_seconds": 600,
        }
        kwargs.update(overrides)
        return build_rtc_token(**kwargs)

    def test_rejects_a_malformed_app_id(self):
        with self.assertRaises(AgoraTokenError):
            self._build(app_id="not-an-app-id")

    def test_rejects_a_malformed_certificate(self):
        with self.assertRaises(AgoraTokenError):
            self._build(app_certificate="")

    def test_rejects_an_empty_channel(self):
        with self.assertRaises(AgoraTokenError):
            self._build(channel_name="")

    def test_rejects_a_uid_outside_the_32_bit_range(self):
        with self.assertRaises(AgoraTokenError):
            self._build(uid=2**32)

    def test_rejects_a_lifetime_longer_than_agora_allows(self):
        with self.assertRaises(AgoraTokenError):
            self._build(expire_seconds=MAX_EXPIRE_SECONDS + 1)

    def test_rejects_something_that_is_not_a_token(self):
        with self.assertRaises(AgoraTokenError):
            decode_rtc_token("006nonsense")
