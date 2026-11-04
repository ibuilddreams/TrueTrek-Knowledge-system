"""Agora Cloud Recording's REST API — the four calls a recording is made of.

Cloud Recording is a **third** Agora product beside the RTC call
(`agora.py`) and the Interactive Whiteboard (`whiteboard_api.py`), and it is
authenticated differently from both: the console's RESTful **Customer ID and
Customer Secret** as HTTP Basic, not the App Certificate and not the
whiteboard's Access Key. Nothing here is reusable from either of the others,
and all three fail independently on purpose.

What Agora runs for us is a headless client that joins one of our channels,
subscribes to everyone in it, composites the streams and uploads the result
**into a bucket we own** — Agora never hosts the file, which is why
`storage.py` exists and why `storageConfig` below carries our own keys.

The sequence is fixed and every step depends on the one before it:

    acquire(cname, uid)              -> resourceId   (short-lived; start soon)
    start(resourceId, ...)           -> sid          (the recording itself)
    query(resourceId, sid)           -> status + the file list so far
    stop(resourceId, sid)            -> the final file list

`resourceId` and `sid` together *are* the recording as far as Agora is
concerned: lose them and there is no way left to stop or ask about it, which
is why `ClassSessionRecording` stores both before the recorder is even running.

Three behaviours of this API shape everything above it:

* **`query` and `stop` answer 404 once the recorder has gone**, and the
  recorder goes by itself when the channel empties (`maxIdleTime`). That is
  the *ordinary* end of a class, not an error — but a 404 carries no file
  list, so the monitor keeps the last list `query` gave it rather than
  depending on `stop` to return one (`RecordingGoneError`).
* **`fileList` arrives in two shapes.** With one output format Agora sends a
  bare filename string; with several it sends a list of objects. Both are
  normalised by `file_list_from` so nothing upstream has to care.
* **A stopped recording is not yet an uploaded one.** The file list names
  objects that may still be landing in the bucket, which is why the monitor
  confirms them with `storage.object_exists` before anyone is notified.
"""

import base64
import json
import logging

import requests

from .exceptions import RecordingGoneError, RecordingUnavailableError

logger = logging.getLogger(__name__)

API_BASE_URL = "https://api.agora.io/v1/apps"

# Composite recording: one file with every participant mixed into a single
# frame. The alternative modes are `individual` (one file per person, which a
# student would have no way to watch) and `web` (a headless browser recording
# a page, which costs considerably more and needs an authenticated entry point
# into our own classroom) — see the module docstring in `services.py` for why
# this is the one wired up.
MODE_MIX = "mix"

# Nobody is watching a spinner for `start` — it runs on a background thread —
# but a request that hangs holds a thread and delays the recording's first
# heartbeat, so every call is bounded.
REQUEST_TIMEOUT_SECONDS = 15

# Agora's own cap on how long an acquired resource stays usable. We start
# within seconds of acquiring, so this only matters if the process dies in
# between, but it is sent explicitly rather than left to a default.
RESOURCE_EXPIRY_HOURS = 24


class RecordingSession:
    """The handle `services` keeps on one recording at Agora.

    A plain value object rather than a dict so that the two identifiers that
    cannot be recovered if lost — `resource_id` and `sid` — are named at every
    call site.
    """

    __slots__ = ("resource_id", "sid")

    def __init__(self, resource_id, sid=""):
        self.resource_id = resource_id
        self.sid = sid

    def __repr__(self):  # pragma: no cover - debugging aid
        return f"RecordingSession(resource_id={self.resource_id!r}, sid={self.sid!r})"


def basic_auth_header(customer_id, customer_secret):
    raw = f"{customer_id}:{customer_secret}".encode("utf-8")
    return f"Basic {base64.b64encode(raw).decode('ascii')}"


def _url(app_id, *parts):
    return "/".join([API_BASE_URL, app_id, "cloud_recording", *[str(part) for part in parts]])


def _request(method, url, *, auth_header, payload=None, session=None, allow_gone=False):
    """One call to Agora, with every failure turned into a safe sentence.

    Agora's error bodies quote internal codes and occasionally echo the
    request — which contains our bucket's secret key — so the body is logged
    at a truncated length and never travels back to a browser.
    """
    http = session or requests
    headers = {"Authorization": auth_header, "Content-Type": "application/json"}

    try:
        response = http.request(
            method,
            url,
            headers=headers,
            json=payload if payload is not None else None,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        logger.exception("class_sessions: could not reach the recording service at %s", url)
        raise RecordingUnavailableError(
            "The recording service didn't respond. The class itself is unaffected."
        ) from exc

    if response.status_code == 404 and allow_gone:
        # The recorder has already left — the usual end of a class, not a
        # fault. The caller has its own last-known file list to fall back on.
        raise RecordingGoneError("This recording has already finished.")

    if response.status_code >= 400:
        logger.error(
            "class_sessions: recording call %s failed (%s): %s",
            url,
            response.status_code,
            response.text[:500],
        )
        if response.status_code in (401, 403):
            raise RecordingUnavailableError(
                "The recording service rejected these credentials. Ask an administrator "
                "to check AGORA_CUSTOMER_ID / AGORA_CUSTOMER_SECRET."
            )
        raise RecordingUnavailableError(
            "The recording service refused this request. The class itself is unaffected."
        )

    try:
        return response.json() or {}
    except ValueError as exc:
        logger.error(
            "class_sessions: recording call %s returned non-JSON: %s", url, response.text[:500]
        )
        raise RecordingUnavailableError(
            "The recording service returned an unreadable reply."
        ) from exc


def acquire(*, app_id, auth_header, channel_name, recorder_uid, session=None):
    """Reserves a recorder and returns the `resourceId` to start it with."""
    payload = {
        "cname": channel_name,
        "uid": str(recorder_uid),
        "clientRequest": {"resourceExpiredHour": RESOURCE_EXPIRY_HOURS, "scene": 0},
    }
    data = _request(
        "POST",
        _url(app_id, "acquire"),
        auth_header=auth_header,
        payload=payload,
        session=session,
    )
    resource_id = data.get("resourceId")
    if not resource_id:
        logger.error("class_sessions: acquire returned no resourceId: %s", data)
        raise RecordingUnavailableError("The recording service didn't reserve a recorder.")
    return RecordingSession(resource_id)


def start(
    *,
    app_id,
    auth_header,
    recording,
    channel_name,
    recorder_uid,
    token,
    storage_config,
    max_idle_seconds,
    transcoding_config,
    session=None,
):
    """Sends the recorder into the channel. Returns the same handle with `sid`.

    `token` is an ordinary RTC token minted for `recorder_uid` by
    `agora.build_rtc_token` — the recorder is a channel participant like any
    other and is refused without one, which is exactly what stops anybody
    else's recorder joining our classes.
    """
    payload = {
        "cname": channel_name,
        "uid": str(recorder_uid),
        "clientRequest": {
            "token": token,
            "recordingConfig": {
                # 0 = communication, matching the browser's `mode: "rtc"`
                # client (frontend/src/hooks/useAgoraCall.js). A mismatch here
                # records silence.
                "channelType": 0,
                # 2 = audio and video.
                "streamTypes": 2,
                "maxIdleTime": max_idle_seconds,
                # 0 = subscribe to everyone, in batches of up to 17 uids.
                "subscribeUidGroup": 0,
                "transcodingConfig": transcoding_config,
            },
            # HLS is written as the class runs; the MP4 is assembled at the
            # end and is what a plain <video> element can play, so both are
            # asked for and `services._pick_playable_file` prefers the MP4.
            "recordingFileConfig": {"avFileType": ["hls", "mp4"]},
            "storageConfig": storage_config,
        },
    }
    data = _request(
        "POST",
        _url(app_id, "resourceid", recording.resource_id, "mode", MODE_MIX, "start"),
        auth_header=auth_header,
        payload=payload,
        session=session,
    )
    sid = data.get("sid")
    if not sid:
        logger.error("class_sessions: start returned no sid: %s", data)
        raise RecordingUnavailableError("The recording service didn't start a recording.")
    recording.sid = sid
    return recording


def query(*, app_id, auth_header, recording, session=None):
    """Asks how a running recording is doing. Raises `RecordingGoneError` once
    the recorder has left, which is how an idle-stopped class is noticed."""
    return _request(
        "GET",
        _url(
            app_id,
            "resourceid",
            recording.resource_id,
            "sid",
            recording.sid,
            "mode",
            MODE_MIX,
            "query",
        ),
        auth_header=auth_header,
        session=session,
        allow_gone=True,
    )


def stop(*, app_id, auth_header, recording, channel_name, recorder_uid, session=None):
    """Ends the recording and returns Agora's final word on it.

    `async_stop` is false so the call waits for the recorder to actually leave
    and answers with the finished file list — the alternative returns
    immediately and leaves us with nothing to tell students about.
    """
    payload = {
        "cname": channel_name,
        "uid": str(recorder_uid),
        "clientRequest": {"async_stop": False},
    }
    return _request(
        "POST",
        _url(
            app_id,
            "resourceid",
            recording.resource_id,
            "sid",
            recording.sid,
            "mode",
            MODE_MIX,
            "stop",
        ),
        auth_header=auth_header,
        payload=payload,
        session=session,
        allow_gone=True,
    )


def file_list_from(response):
    """The recorded files in one shape, whatever shape Agora sent.

    Agora answers with a bare filename string when only one output format was
    asked for and a list of objects when several were; `serverResponse` is
    absent entirely while a recorder is still initialising. Everything
    upstream wants the same thing — a list of `{"filename": ..., ...}` — so
    the branching stops here.
    """
    server_response = (response or {}).get("serverResponse") or {}
    raw = server_response.get("fileList")

    if isinstance(raw, str):
        return [{"filename": raw}] if raw.strip() else []

    if isinstance(raw, list):
        files = []
        for entry in raw:
            if isinstance(entry, dict) and entry.get("filename"):
                files.append(entry)
            elif isinstance(entry, str) and entry.strip():
                files.append({"filename": entry})
        return files

    return []


def upload_finished(response):
    """Whether Agora considers every file uploaded.

    Advisory only — the bucket itself is the authority (`storage.object_exists`)
    — but it is the cheapest signal available and saves a round trip to S3 on
    every poll of a recording that is plainly still running.
    """
    server_response = (response or {}).get("serverResponse") or {}
    return server_response.get("uploadingStatus") == "uploaded"


def describe(response):  # pragma: no cover - logging aid
    try:
        return json.dumps(response)[:500]
    except (TypeError, ValueError):
        return repr(response)[:500]
