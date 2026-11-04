"""The Agora upload bucket — AWS SigV4, signed longhand.

Two Agora products upload into storage we own and neither hosts what it
wrote: Cloud Recording puts a class's video there, and Real-Time
Transcription puts that class's WebVTT caption slices there. So this module
serves both — `build_presigned_url` and `object_exists` are what a recording
is handed out and confirmed by, while `list_objects` and `get_object` are how
the meeting-notes collector finds and reads captions whose file names Agora
does not document (`services._collect_transcript`).

This LMS is the only thing that can hand a student the file afterwards. The bucket stays
**private**: nothing is served from a public URL, and a recording is released
only as a signed link with hours of life, minted per viewer by
`views.ClassSessionRecordingView` behind the same enrolment check that guards
the classroom door. That is the same rule the rest of this app already keeps —
`live_sessions` never puts a meeting link in a listing either.

Signing is written out here rather than taken as a dependency, for the same
reason `agora.py` and `whiteboard.py` are: `boto3` is a large transitive tree
for one URL, and the whole of SigV4's presigned form is the forty lines below.
Because it *is* plain SigV4, any S3-compatible store works — S3, Cloudflare
R2, DigitalOcean Spaces, MinIO, Wasabi — by pointing
`AGORA_RECORDING_S3_ENDPOINT` at it.

Two details of the format are the ones a careless edit breaks. The query
string is signed in its **encoded, sorted** form, and the credential inside it
contains slashes which *must* be percent-encoded there while the object key's
slashes must not be — sign the wrong one of those two and S3 answers
`SignatureDoesNotMatch` and nothing else. And the canonical request ends with
the literal `UNSIGNED-PAYLOAD` rather than a body hash, which is what makes a
presigned URL usable by a browser that never sends one.
"""

import datetime as dt
import hashlib
import hmac
import logging
from urllib.parse import quote, unquote
from xml.etree import ElementTree

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

ALGORITHM = "AWS4-HMAC-SHA256"
SERVICE = "s3"

# SigV4's own ceiling on a presigned URL. Anything longer is rejected at
# signing time by AWS rather than at use time, so it is clamped here.
MAX_URL_TTL_SECONDS = 7 * 24 * 60 * 60

# A HEAD against the finished object, used to confirm a recording really
# landed before thirty students are told to go and watch it. Short: it is one
# round trip to a bucket we own, on a background thread nobody is watching.
EXISTS_TIMEOUT_SECONDS = 10

# Listing and reading, for the caption slices a transcription wrote. Both run
# on a background thread too, and both are reading small text files out of a
# folder this server told Agora to use.
LIST_TIMEOUT_SECONDS = 15
GET_TIMEOUT_SECONDS = 30

# One page of a listing, and how many pages are ever walked. A class produces
# one caption slice a minute by default, so the first page covers a sixteen-
# hour lecture; the page cap exists only so a prefix pointed at the wrong
# place cannot walk a bucket holding a year of recordings.
MAX_LIST_KEYS = 1000
MAX_LIST_PAGES = 20

# A caption slice is a few kilobytes of text. This is a guard against reading
# something that is not one, not a limit any real transcript approaches.
MAX_OBJECT_BYTES = 8 * 1024 * 1024


class StorageNotConfiguredError(RuntimeError):
    """No bucket or no keys — a configuration fault, never a request's doing."""


def _config():
    bucket = (getattr(settings, "AGORA_RECORDING_BUCKET", "") or "").strip()
    access_key = (getattr(settings, "AGORA_RECORDING_ACCESS_KEY", "") or "").strip()
    secret_key = (getattr(settings, "AGORA_RECORDING_SECRET_KEY", "") or "").strip()
    region = (getattr(settings, "AGORA_RECORDING_S3_REGION", "") or "us-east-1").strip()
    endpoint = (getattr(settings, "AGORA_RECORDING_S3_ENDPOINT", "") or "").strip()
    path_style = bool(getattr(settings, "AGORA_RECORDING_S3_PATH_STYLE", False))
    return bucket, access_key, secret_key, region, endpoint, path_style


def is_storage_configured():
    bucket, access_key, secret_key, _, _, _ = _config()
    return bool(bucket and access_key and secret_key)


def public_base_url():
    return (getattr(settings, "AGORA_RECORDING_PUBLIC_BASE_URL", "") or "").strip().rstrip("/")


def _endpoint_parts(region, endpoint):
    """`(scheme, host)` for the configured store, AWS or otherwise."""
    if endpoint:
        scheme, _, host = endpoint.partition("://")
        if not host:
            scheme, host = "https", endpoint
    else:
        scheme, host = "https", f"s3.{region}.amazonaws.com"
    return scheme, host.rstrip("/")


def _host_and_path(bucket, region, endpoint, path_style, key):
    """Where the object lives, in the two addressing styles S3 defines.

    Virtual-hosted (`bucket.host/key`) is the modern default; path-style
    (`host/bucket/key`) is what MinIO and some self-hosted gateways need, and
    getting it wrong shows up as a 404 for an object that is plainly there.
    """
    scheme, host = _endpoint_parts(region, endpoint)
    encoded_key = quote(key.lstrip("/"), safe="/")

    if path_style:
        return scheme, host, f"/{bucket}/{encoded_key}"
    return scheme, f"{bucket}.{host}", f"/{encoded_key}"


def _bucket_root(bucket, region, endpoint, path_style):
    """Where the *bucket itself* is addressed — what a listing is signed for.

    Deliberately not `_host_and_path(..., key="")`: a path-style listing is
    `/{bucket}`, with no trailing slash. S3 tolerates the slash, several
    S3-compatible gateways do not, and the failure is a signature mismatch
    rather than anything that names the cause.
    """
    scheme, host = _endpoint_parts(region, endpoint)
    if path_style:
        return scheme, host, f"/{bucket}"
    return scheme, f"{bucket}.{host}", "/"


def _signing_key(secret_key, datestamp, region):
    """SigV4's four-step key derivation — date, region, service, terminator."""
    key = hmac.new(f"AWS4{secret_key}".encode("utf-8"), datestamp.encode("utf-8"), hashlib.sha256).digest()
    key = hmac.new(key, region.encode("utf-8"), hashlib.sha256).digest()
    key = hmac.new(key, SERVICE.encode("utf-8"), hashlib.sha256).digest()
    return hmac.new(key, b"aws4_request", hashlib.sha256).digest()


def _encode_query(params):
    """Canonical query: sorted by key, every value fully percent-encoded.

    `safe=""` matters — the credential contains `/` characters that have to
    travel as `%2F`, unlike the object key in the path above.
    """
    return "&".join(
        f"{quote(name, safe='-_.~')}={quote(str(value), safe='-_.~')}"
        for name, value in sorted(params.items())
    )


def build_presigned_url(key, *, expires_in=None, method="GET", now=None):
    """A signed, time-limited URL for one object.

    `now` exists only so tests can pin a signature to known bytes; production
    always takes the clock. `method` is part of the signature, so a URL signed
    for HEAD cannot be used to GET the file and vice versa — which is what
    lets `object_exists` probe a recording without ever minting something
    playable.
    """
    base = public_base_url()
    if base:
        # A CDN in front of the bucket: there is nothing to sign, because the
        # objects behind it are already readable. Deliberately not a silent
        # fallback — it is only reached when an operator set that setting.
        return f"{base}/{quote(key.lstrip('/'), safe='/')}"

    bucket, access_key, secret_key, region, endpoint, path_style = _config()
    if not (bucket and access_key and secret_key):
        raise StorageNotConfiguredError(
            "No recording bucket is configured (AGORA_RECORDING_BUCKET / _ACCESS_KEY / _SECRET_KEY)."
        )

    scheme, host, canonical_path = _host_and_path(bucket, region, endpoint, path_style, key)
    return _sign(
        method,
        scheme=scheme,
        host=host,
        canonical_path=canonical_path,
        access_key=access_key,
        secret_key=secret_key,
        region=region,
        expires_in=expires_in,
        now=now,
    )


def _sign(
    method,
    *,
    scheme,
    host,
    canonical_path,
    access_key,
    secret_key,
    region,
    extra_query=None,
    expires_in=None,
    now=None,
):
    """SigV4's presigned form over any request this module makes.

    Shared by the three of them — an object GET/HEAD and a bucket listing —
    because the parts that are easy to get wrong are the parts they have in
    common: the query string is signed in its **encoded, sorted** form with
    every parameter in it (a listing's `list-type` and `prefix` included, not
    only the `X-Amz-*` ones), and the canonical request ends in the literal
    `UNSIGNED-PAYLOAD`.
    """
    ttl = expires_in or getattr(settings, "AGORA_RECORDING_URL_TTL_SECONDS", 6 * 60 * 60)
    ttl = max(1, min(int(ttl), MAX_URL_TTL_SECONDS))

    now = now or dt.datetime.now(dt.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    datestamp = now.strftime("%Y%m%d")
    scope = f"{datestamp}/{region}/{SERVICE}/aws4_request"

    canonical_query = _encode_query(
        {
            **(extra_query or {}),
            "X-Amz-Algorithm": ALGORITHM,
            "X-Amz-Credential": f"{access_key}/{scope}",
            "X-Amz-Date": amz_date,
            "X-Amz-Expires": ttl,
            "X-Amz-SignedHeaders": "host",
        }
    )

    canonical_request = "\n".join(
        [
            method.upper(),
            canonical_path,
            canonical_query,
            f"host:{host}\n",
            "host",
            "UNSIGNED-PAYLOAD",
        ]
    )

    string_to_sign = "\n".join(
        [
            ALGORITHM,
            amz_date,
            scope,
            hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
        ]
    )

    signature = hmac.new(
        _signing_key(secret_key, datestamp, region),
        string_to_sign.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return f"{scheme}://{host}{canonical_path}?{canonical_query}&X-Amz-Signature={signature}"


def object_exists(key, *, session=None):
    """Whether the recorder has finished putting this object in the bucket.

    Asked before a class's students are notified, because Agora reports a
    recording as stopped a little before the last bytes are uploaded, and a
    "your recording is ready" notification that leads to a 404 is worse than
    one that arrives a minute later.

    Any failure answers `False` rather than raising: the caller's next move is
    to wait and ask again, and a bucket that cannot be reached is not evidence
    that the file is missing.
    """
    http = session or requests
    try:
        url = build_presigned_url(key, method="HEAD", expires_in=EXISTS_TIMEOUT_SECONDS * 6)
    except StorageNotConfiguredError:
        return False

    try:
        response = http.head(url, timeout=EXISTS_TIMEOUT_SECONDS)
    except requests.RequestException:
        logger.warning("class_sessions: could not reach the recording bucket to check %s", key)
        return False

    return 200 <= response.status_code < 300


def list_objects(prefix, *, session=None, max_keys=MAX_LIST_KEYS):
    """Every object key under `prefix`, oldest name first.

    The meeting-notes collector cannot ask for its caption files by name:
    Agora documents *where* Real-Time Transcription writes (the
    `fileNamePrefix` we hand it) but not what it calls what it writes, and the
    shape has changed between API versions. Listing a folder we own and
    reading everything in it is the only thing that stays true whatever Agora
    names the slices — which is also why each run gets a folder of its own
    (`ClassSessionNotes.storage_prefix`), so a class transcribed twice never
    reads the other run's words.

    Raises `StorageNotConfiguredError` without keys, and returns `[]` for a
    bucket that cannot be reached or that answers something unreadable: the
    caller's next move is to wait and ask again, and a listing that failed is
    not evidence that a folder is empty.
    """
    bucket, access_key, secret_key, region, endpoint, path_style = _config()
    if not (bucket and access_key and secret_key):
        raise StorageNotConfiguredError(
            "No recording bucket is configured (AGORA_RECORDING_BUCKET / _ACCESS_KEY / _SECRET_KEY)."
        )

    http = session or requests
    scheme, host, canonical_path = _bucket_root(bucket, region, endpoint, path_style)

    keys = []
    token = None
    # Bounded rather than `while True`: a mis-set prefix pointed at the root of
    # a bucket holding a year of recordings must not walk all of it.
    for _ in range(MAX_LIST_PAGES):
        query = {
            "list-type": "2",
            "prefix": prefix,
            "max-keys": str(int(max_keys)),
            "encoding-type": "url",
        }
        if token:
            query["continuation-token"] = token

        url = _sign(
            "GET",
            scheme=scheme,
            host=host,
            canonical_path=canonical_path,
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            extra_query=query,
            expires_in=LIST_TIMEOUT_SECONDS * 6,
        )

        try:
            response = http.get(url, timeout=LIST_TIMEOUT_SECONDS)
        except requests.RequestException:
            logger.warning("class_sessions: could not reach the bucket to list %s", prefix)
            return []

        if not 200 <= response.status_code < 300:
            logger.warning(
                "class_sessions: listing %s failed (%s): %s",
                prefix,
                response.status_code,
                (response.text or "")[:300],
            )
            return []

        page_keys, token = _parse_listing(response.content)
        keys.extend(page_keys)
        if not token:
            break

    return sorted(set(keys))


def _parse_listing(body):
    """`(keys, continuation_token)` out of a ListObjectsV2 XML response.

    `encoding-type=url` is asked for above, so every key comes back
    percent-encoded — S3 sends XML, and a key containing a character XML
    cannot carry would otherwise arrive silently mangled rather than as an
    error. It is decoded back here, once, so nothing downstream has to know.
    """
    try:
        root = ElementTree.fromstring(body)
    except ElementTree.ParseError:
        logger.warning("class_sessions: the bucket returned an unreadable listing")
        return [], None

    # S3 namespaces the document; S3-compatible stores are inconsistent about
    # it, so the tag's local name is what is matched rather than a fixed URI.
    def local(element):
        return element.tag.rsplit("}", 1)[-1]

    keys = []
    token = None
    truncated = False
    for child in root:
        name = local(child)
        if name == "Contents":
            for field in child:
                if local(field) == "Key" and field.text:
                    keys.append(unquote(field.text))
        elif name == "NextContinuationToken" and child.text:
            token = child.text
        elif name == "IsTruncated":
            truncated = str(child.text or "").strip().lower() == "true"

    return keys, token if truncated else None


def get_object(key, *, session=None, max_bytes=MAX_OBJECT_BYTES):
    """The bytes of one object, or `None` if it cannot be read.

    Used only for the caption slices a transcription wrote — small text files
    we put there ourselves. `max_bytes` is a guard rather than a limit anyone
    should reach: it stops a mis-set prefix turning "collect the transcript"
    into "download an hour of video into memory".

    Answers `None` rather than raising for every failure, for the same reason
    `object_exists` answers `False`: the caller is a collector on a background
    thread whose next move is to carry on with the slices it did get.
    """
    http = session or requests
    try:
        url = build_presigned_url(key, method="GET", expires_in=GET_TIMEOUT_SECONDS * 6)
    except StorageNotConfiguredError:
        return None

    try:
        response = http.get(url, timeout=GET_TIMEOUT_SECONDS)
    except requests.RequestException:
        logger.warning("class_sessions: could not reach the bucket to read %s", key)
        return None

    if not 200 <= response.status_code < 300:
        logger.warning(
            "class_sessions: reading %s failed (%s)", key, response.status_code
        )
        return None

    content = response.content or b""
    if len(content) > max_bytes:
        logger.warning(
            "class_sessions: %s is %s bytes — reading only the first %s",
            key,
            len(content),
            max_bytes,
        )
        return content[:max_bytes]
    return content
