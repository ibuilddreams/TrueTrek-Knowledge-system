"""Playback URLs — the signature, and the two halves of it that rot quietly.

A wrong presigned URL fails as `SignatureDoesNotMatch` and nothing else: S3
never says which part it disagreed with, so the asserts here are about the
pieces of the canonical form that are easy to get subtly wrong and impossible
to debug from the outside.

The signing-key derivation is pinned against **AWS's own published example**
(the `iam` / 20150830 / us-east-1 vector from the Signature Version 4
documentation), which is the only check in this file that is evidence rather
than self-consistency. Everything else is asserted by taking the URL apart
again.
"""

import datetime as dt
from unittest import mock
from urllib.parse import parse_qs, urlparse

import requests
from django.test import SimpleTestCase, override_settings

from .. import storage

# AWS's published Signature Version 4 example credentials.
AWS_EXAMPLE_SECRET = "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY"
AWS_EXAMPLE_SIGNING_KEY = "c4afb1cc5771d871763a393e44b703571b55cc28424d1a5e86da6ed3c154a4b9"

BUCKET_SETTINGS = dict(
    AGORA_RECORDING_BUCKET="truetrek-recordings",
    AGORA_RECORDING_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE",
    AGORA_RECORDING_SECRET_KEY=AWS_EXAMPLE_SECRET,
    AGORA_RECORDING_S3_REGION="us-east-1",
    AGORA_RECORDING_S3_ENDPOINT="",
    AGORA_RECORDING_S3_PATH_STYLE=False,
    AGORA_RECORDING_PUBLIC_BASE_URL="",
    AGORA_RECORDING_URL_TTL_SECONDS=3600,
)

FIXED_NOW = dt.datetime(2026, 11, 2, 9, 30, 0, tzinfo=dt.timezone.utc)
KEY = "class-recordings/42/cls-abc_0.mp4"


class SigningKeyTests(SimpleTestCase):
    def test_the_key_derivation_matches_aws_published_example(self):
        """The one vector in this file that comes from outside this codebase.

        AWS documents this exact chain — secret, date, region, service,
        terminator — and a drift in any link of it produces a signature that
        is wrong in a way no error message explains.
        """
        # AWS published the vector for the `iam` service; the chain is
        # identical for `s3` and it is the chain, not the service name, that
        # this is evidence about.
        with mock.patch.object(storage, "SERVICE", "iam"):
            key = storage._signing_key(AWS_EXAMPLE_SECRET, "20150830", "us-east-1")
        self.assertEqual(key.hex(), AWS_EXAMPLE_SIGNING_KEY)


@override_settings(**BUCKET_SETTINGS)
class PresignedUrlTests(SimpleTestCase):
    def test_a_signed_url_carries_every_part_s3_requires(self):
        url = storage.build_presigned_url(KEY, now=FIXED_NOW)
        parsed = urlparse(url)
        params = parse_qs(parsed.query)

        self.assertEqual(parsed.scheme, "https")
        self.assertEqual(parsed.netloc, "truetrek-recordings.s3.us-east-1.amazonaws.com")
        self.assertEqual(parsed.path, f"/{KEY}")
        self.assertEqual(params["X-Amz-Algorithm"], ["AWS4-HMAC-SHA256"])
        self.assertEqual(params["X-Amz-Date"], ["20261102T093000Z"])
        self.assertEqual(params["X-Amz-Expires"], ["3600"])
        self.assertEqual(params["X-Amz-SignedHeaders"], ["host"])
        self.assertEqual(
            params["X-Amz-Credential"],
            ["AKIAIOSFODNN7EXAMPLE/20261102/us-east-1/s3/aws4_request"],
        )
        self.assertEqual(len(params["X-Amz-Signature"][0]), 64)

    def test_the_credentials_slashes_are_encoded_and_the_keys_are_not(self):
        """The single most common way to get this wrong.

        `X-Amz-Credential` lives in the query string, where `/` must travel as
        `%2F`; the object key lives in the path, where it must not. Signing
        the wrong one of those two yields a URL that looks perfectly ordinary
        and is refused.
        """
        url = storage.build_presigned_url(KEY, now=FIXED_NOW)
        query = urlparse(url).query

        self.assertIn("X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20261102", query)
        self.assertIn(f"/{KEY}?", url)

    def test_the_signature_is_stable_for_the_same_inputs(self):
        first = storage.build_presigned_url(KEY, now=FIXED_NOW)
        second = storage.build_presigned_url(KEY, now=FIXED_NOW)
        self.assertEqual(first, second)

    def test_the_method_is_part_of_the_signature(self):
        """A HEAD probe must not double as a playable link.

        `object_exists` signs a HEAD to check a recording landed; if the
        method were outside the signature, that probe would be a URL anybody
        could stream the class from.
        """
        get_url = storage.build_presigned_url(KEY, now=FIXED_NOW, method="GET")
        head_url = storage.build_presigned_url(KEY, now=FIXED_NOW, method="HEAD")

        get_signature = parse_qs(urlparse(get_url).query)["X-Amz-Signature"]
        head_signature = parse_qs(urlparse(head_url).query)["X-Amz-Signature"]
        self.assertNotEqual(get_signature, head_signature)

    def test_a_different_key_signs_differently(self):
        other = storage.build_presigned_url(
            "class-recordings/42/cls-abc_1.mp4", now=FIXED_NOW
        )
        this = storage.build_presigned_url(KEY, now=FIXED_NOW)
        self.assertNotEqual(other, this)

    def test_an_expiry_longer_than_sigv4_allows_is_clamped(self):
        url = storage.build_presigned_url(KEY, expires_in=10 * 24 * 60 * 60, now=FIXED_NOW)
        params = parse_qs(urlparse(url).query)
        self.assertEqual(params["X-Amz-Expires"], [str(storage.MAX_URL_TTL_SECONDS)])

    @override_settings(AGORA_RECORDING_S3_PATH_STYLE=True)
    def test_path_style_puts_the_bucket_in_the_path(self):
        """What MinIO and some self-hosted gateways need. Getting the
        addressing style wrong reads as a 404 for an object that is there."""
        url = storage.build_presigned_url(KEY, now=FIXED_NOW)
        parsed = urlparse(url)
        self.assertEqual(parsed.netloc, "s3.us-east-1.amazonaws.com")
        self.assertEqual(parsed.path, f"/truetrek-recordings/{KEY}")

    @override_settings(AGORA_RECORDING_S3_ENDPOINT="https://abc123.r2.cloudflarestorage.com")
    def test_a_custom_endpoint_is_used_in_place_of_aws(self):
        url = storage.build_presigned_url(KEY, now=FIXED_NOW)
        self.assertEqual(
            urlparse(url).netloc, "truetrek-recordings.abc123.r2.cloudflarestorage.com"
        )

    @override_settings(AGORA_RECORDING_PUBLIC_BASE_URL="https://cdn.example.com/recordings/")
    def test_a_public_base_url_is_not_signed_at_all(self):
        """The escape hatch for a CDN in front of a public bucket — reached
        only because an operator set that setting, never as a fallback."""
        url = storage.build_presigned_url(KEY, now=FIXED_NOW)
        self.assertEqual(url, f"https://cdn.example.com/recordings/{KEY}")
        self.assertNotIn("X-Amz-Signature", url)

    @override_settings(AGORA_RECORDING_BUCKET="", AGORA_RECORDING_PUBLIC_BASE_URL="")
    def test_an_unconfigured_bucket_raises_rather_than_signing_nonsense(self):
        with self.assertRaises(storage.StorageNotConfiguredError):
            storage.build_presigned_url(KEY, now=FIXED_NOW)


@override_settings(**BUCKET_SETTINGS)
class ObjectExistsTests(SimpleTestCase):
    def test_a_present_object_is_confirmed(self):
        http = mock.Mock()
        http.head.return_value = mock.Mock(status_code=200)
        self.assertTrue(storage.object_exists(KEY, session=http))

    def test_a_missing_object_is_not_confirmed(self):
        http = mock.Mock()
        http.head.return_value = mock.Mock(status_code=404)
        self.assertFalse(storage.object_exists(KEY, session=http))

    def test_an_unreachable_bucket_answers_false_rather_than_raising(self):
        """A bucket we cannot reach is not evidence the file is missing — the
        caller's next move is to wait and ask again, and raising here would
        fail a recording that is sitting there perfectly fine."""
        http = mock.Mock()
        http.head.side_effect = requests.ConnectionError("no route")
        self.assertFalse(storage.object_exists(KEY, session=http))

    @override_settings(AGORA_RECORDING_BUCKET="")
    def test_an_unconfigured_bucket_answers_false(self):
        self.assertFalse(storage.object_exists(KEY, session=mock.Mock()))


@override_settings(**BUCKET_SETTINGS)
class ListObjectsTests(SimpleTestCase):
    """Finding caption files whose names Agora does not document.

    Real-Time Transcription documents *where* it writes — the prefix we hand
    it — but not what it calls what it writes, and the naming has changed
    between API versions. Listing a folder we own is the only thing that
    stays true either way, which makes this the load-bearing half of the
    meeting-notes collector.
    """

    LISTING = """<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>truetrek-recordings</Name>
  <Prefix>classnotes/42/7/</Prefix>
  <IsTruncated>false</IsTruncated>
  <Contents><Key>classnotes/42/7/subtitle.m3u8</Key></Contents>
  <Contents><Key>classnotes/42/7/0.vtt</Key></Contents>
  <Contents><Key>classnotes/42/7/1.vtt</Key></Contents>
</ListBucketResult>"""

    def _http(self, *responses):
        http = mock.Mock()
        http.get.side_effect = [
            mock.Mock(status_code=200, content=body.encode("utf-8"))
            for body in responses
        ]
        return http

    def test_the_keys_under_a_prefix_come_back_sorted(self):
        http = self._http(self.LISTING)
        self.assertEqual(
            storage.list_objects("classnotes/42/7/", session=http),
            [
                "classnotes/42/7/0.vtt",
                "classnotes/42/7/1.vtt",
                "classnotes/42/7/subtitle.m3u8",
            ],
        )

    def test_the_listing_parameters_are_part_of_the_signature(self):
        """SigV4 signs the *whole* query string. A `prefix` added to the URL
        after signing is a `SignatureDoesNotMatch` and nothing else."""
        http = self._http(self.LISTING)
        storage.list_objects("classnotes/42/7/", session=http)

        url = http.get.call_args[0][0]
        self.assertIn("list-type=2", url)
        self.assertIn("prefix=classnotes%2F42%2F7%2F", url)
        self.assertIn("X-Amz-Signature=", url)

    def test_a_virtual_hosted_listing_addresses_the_bucket_root(self):
        http = self._http(self.LISTING)
        storage.list_objects("classnotes/", session=http)
        parsed = urlparse(http.get.call_args[0][0])
        self.assertEqual(parsed.netloc, "truetrek-recordings.s3.us-east-1.amazonaws.com")
        self.assertEqual(parsed.path, "/")

    @override_settings(AGORA_RECORDING_S3_PATH_STYLE=True)
    def test_a_path_style_listing_has_no_trailing_slash(self):
        """S3 tolerates `/bucket/`; several S3-compatible gateways do not,
        and they answer with a signature error rather than anything that
        names the cause."""
        http = self._http(self.LISTING)
        storage.list_objects("classnotes/", session=http)
        self.assertEqual(urlparse(http.get.call_args[0][0]).path, "/truetrek-recordings")

    def test_a_truncated_listing_is_followed(self):
        page_one = """<?xml version="1.0"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <IsTruncated>true</IsTruncated>
  <NextContinuationToken>tok-2</NextContinuationToken>
  <Contents><Key>classnotes/42/7/0.vtt</Key></Contents>
</ListBucketResult>"""
        page_two = """<?xml version="1.0"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <IsTruncated>false</IsTruncated>
  <Contents><Key>classnotes/42/7/1.vtt</Key></Contents>
</ListBucketResult>"""
        http = self._http(page_one, page_two)
        keys = storage.list_objects("classnotes/42/7/", session=http)

        self.assertEqual(keys, ["classnotes/42/7/0.vtt", "classnotes/42/7/1.vtt"])
        self.assertIn("continuation-token=tok-2", http.get.call_args_list[1][0][0])

    def test_percent_encoded_keys_are_decoded_once(self):
        """`encoding-type=url` is asked for so a key containing a character
        XML cannot carry arrives as an error rather than silently mangled."""
        body = """<?xml version="1.0"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <IsTruncated>false</IsTruncated>
  <Contents><Key>classnotes/42/7/a%20b.vtt</Key></Contents>
</ListBucketResult>"""
        self.assertEqual(
            storage.list_objects("classnotes/42/7/", session=self._http(body)),
            ["classnotes/42/7/a b.vtt"],
        )

    def test_a_namespace_free_listing_is_still_read(self):
        """S3-compatible stores are inconsistent about the namespace, so the
        tag's local name is what is matched rather than a fixed URI."""
        body = (
            "<ListBucketResult><IsTruncated>false</IsTruncated>"
            "<Contents><Key>classnotes/42/7/0.vtt</Key></Contents></ListBucketResult>"
        )
        self.assertEqual(
            storage.list_objects("classnotes/42/7/", session=self._http(body)),
            ["classnotes/42/7/0.vtt"],
        )

    def test_an_unreachable_bucket_is_not_evidence_that_a_folder_is_empty(self):
        http = mock.Mock()
        http.get.side_effect = requests.ConnectionError("no route")
        self.assertEqual(storage.list_objects("classnotes/", session=http), [])

    def test_an_unreadable_listing_answers_empty_rather_than_raising(self):
        http = mock.Mock()
        http.get.return_value = mock.Mock(status_code=200, content=b"<html>nope")
        self.assertEqual(storage.list_objects("classnotes/", session=http), [])

    @override_settings(AGORA_RECORDING_BUCKET="")
    def test_listing_without_credentials_raises_rather_than_lying(self):
        """Unlike a read, this cannot fall back on a CDN: there is nothing to
        list without keys, and answering `[]` would read as "the class was
        silent"."""
        with self.assertRaises(storage.StorageNotConfiguredError):
            storage.list_objects("classnotes/", session=mock.Mock())


@override_settings(**BUCKET_SETTINGS)
class GetObjectTests(SimpleTestCase):
    def test_an_objects_bytes_come_back(self):
        http = mock.Mock()
        http.get.return_value = mock.Mock(status_code=200, content=b"WEBVTT\n")
        self.assertEqual(storage.get_object("classnotes/42/7/0.vtt", session=http), b"WEBVTT\n")

    def test_a_missing_object_answers_none_rather_than_raising(self):
        """The caller is a collector whose next move is to carry on with the
        slices it did get — one unreadable file must not lose a class."""
        http = mock.Mock()
        http.get.return_value = mock.Mock(status_code=404, content=b"")
        self.assertIsNone(storage.get_object("classnotes/42/7/0.vtt", session=http))

    def test_an_unreachable_bucket_answers_none(self):
        http = mock.Mock()
        http.get.side_effect = requests.Timeout("slow")
        self.assertIsNone(storage.get_object("classnotes/42/7/0.vtt", session=http))

    def test_something_far_too_big_is_truncated_rather_than_held_in_memory(self):
        http = mock.Mock()
        http.get.return_value = mock.Mock(status_code=200, content=b"x" * 64)
        self.assertEqual(
            storage.get_object("k", session=http, max_bytes=8), b"x" * 8
        )
