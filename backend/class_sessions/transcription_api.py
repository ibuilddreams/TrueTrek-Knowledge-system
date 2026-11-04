"""Agora Real-Time Transcription's REST API — the three calls notes are made of.

Real-Time Transcription (RTT, "Real-Time Speech-to-Text") is a **fourth**
Agora product beside the RTC call (`agora.py`), the Interactive Whiteboard
(`whiteboard_api.py`) and Cloud Recording (`recording_api.py`). It is enabled
separately on an Agora project — on many projects it has to be turned on by
Agora before any of this answers anything but a 4xx — which is exactly why
nothing here is allowed to break a class.

It is authenticated like Cloud Recording and unlike the other two: the
console's RESTful **Customer ID and Customer Secret** as HTTP Basic. The
settings are shared with recording by default (`services._notes_credentials`)
because they are literally the same key; `AGORA_STT_CUSTOMER_ID` / `_SECRET`
exist only for a deployment that was issued a second one.

What Agora runs for us is a headless client that joins one of our channels,
listens to everyone in it, and writes the words out as **WebVTT caption
slices into a bucket we own**. Agora never hosts the transcript, which is why
`captionConfig.storage` below carries our own keys and why `storage.py` grew
a listing call to find what it wrote.

This targets the **v7 API** (`/api/speech-to-text/v1/...`), which is keyed by
an `agent_id`. The older v5/v6 shape — a `builderToken` plus a `taskId` under
`/v1/projects/<app>/rtsc/speech-to-text/` — reached end of life in June 2026
and is not what any of this speaks, however much of it is still in Agora's
own sample repositories.

    join(...)             -> agent_id   (the transcription itself)
    query(agent_id)       -> its status
    leave(agent_id)       -> ends it

`agent_id` *is* the transcription as far as Agora is concerned: lose it and
there is no way left to stop or ask about it, which is why
`ClassSessionNotes` stores it the moment it arrives.

Four behaviours of this API shape everything above it:

* **`query` and `leave` answer 404 once the bot has gone**, and the bot goes
  by itself when the channel empties (`maxIdleTime`). That is the *ordinary*
  end of a class, not an error (`NotesGoneError`) — and the captions it wrote
  are sitting in the bucket either way, so the monitor goes and collects them
  rather than giving up.
* **A status of STOPPED or FAILED means the same thing as that 404.** The bot
  can stop itself for reasons we never hear about, and a monitor that only
  watched for 404s would poll a dead agent until the class's deadline.
* **`name` must be unique forever.** Agora refuses a name it has already
  seen, so it is minted per run rather than per class — a class transcribed
  twice needs two names.
* **The error body is `{"detail", "reason"}`**, not the `{status, message}`
  envelope this LMS uses and not Cloud Recording's shape either. It is logged
  and never shown to anybody: it quotes internal codes and can echo the
  request, which contains our bucket's secret key.
"""

import json
import logging

import requests

from .exceptions import NotesGoneError, NotesUnavailableError

logger = logging.getLogger(__name__)

API_BASE_URL = "https://api.agora.io/api/speech-to-text/v1/projects"

# Nobody is watching a spinner for `join` — it runs on a background thread —
# but a request that hangs holds a thread and delays the transcription's first
# heartbeat, so every call is bounded.
REQUEST_TIMEOUT_SECONDS = 15

# Statuses Agora reports for an agent. Only the terminal two matter to the
# monitor; the rest are "still going" in one form or another, and treating an
# unknown one as still-going is the safe default (a bot we wrongly believe is
# dead is a transcript that stops halfway through a class).
STATUS_STOPPED = "STOPPED"
STATUS_FAILED = "FAILED"
FINISHED_STATUSES = (STATUS_STOPPED, STATUS_FAILED)


class TranscriptionAgent:
    """The handle `services` keeps on one transcription at Agora.

    A plain value object rather than a dict so that the identifier that cannot
    be recovered if lost — `agent_id` — is named at every call site.
    """

    __slots__ = ("agent_id", "name", "status")

    def __init__(self, agent_id, name="", status=""):
        self.agent_id = agent_id
        self.name = name
        self.status = status

    def __repr__(self):  # pragma: no cover - debugging aid
        return f"TranscriptionAgent(agent_id={self.agent_id!r}, status={self.status!r})"


def _url(app_id, *parts):
    return "/".join([API_BASE_URL, app_id, *[str(part) for part in parts]])


def _describe_error(response):
    """Agora's `{"detail", "reason"}` body, flattened for one log line."""
    try:
        body = response.json() or {}
    except ValueError:
        return (response.text or "")[:500]
    if not isinstance(body, dict):
        return str(body)[:500]
    detail = str(body.get("detail") or "").strip()
    reason = str(body.get("reason") or "").strip()
    return " — ".join(part for part in (reason, detail) if part)[:500] or json.dumps(body)[:500]


def _request(method, url, *, auth_header, payload=None, session=None, allow_gone=False):
    """One call to Agora, with every failure turned into a safe sentence.

    The response body is logged at a truncated length and never travels back
    to a browser: it quotes internal codes and, on a rejected `join`, can echo
    the request we sent — which carries our bucket's secret key.
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
        logger.exception("class_sessions: could not reach the transcription service at %s", url)
        raise NotesUnavailableError(
            "The transcription service didn't respond. The class itself is unaffected."
        ) from exc

    if response.status_code == 404 and allow_gone:
        # The bot has already left — the usual end of a class, not a fault.
        # Whatever it transcribed is in the bucket regardless.
        raise NotesGoneError("This transcription has already finished.")

    if response.status_code >= 400:
        logger.error(
            "class_sessions: transcription call %s failed (%s): %s",
            url,
            response.status_code,
            _describe_error(response),
        )
        if response.status_code in (401, 403):
            raise NotesUnavailableError(
                "The transcription service rejected these credentials. Ask an "
                "administrator to check AGORA_CUSTOMER_ID / AGORA_CUSTOMER_SECRET "
                "and that Real-Time Transcription is enabled on the Agora project."
            )
        raise NotesUnavailableError(
            "The transcription service refused this request. The class itself is unaffected."
        )

    try:
        return response.json() or {}
    except ValueError as exc:
        logger.error(
            "class_sessions: transcription call %s returned non-JSON: %s",
            url,
            response.text[:500],
        )
        raise NotesUnavailableError(
            "The transcription service returned an unreadable reply."
        ) from exc


def join(
    *,
    app_id,
    auth_header,
    name,
    channel_name,
    bot_uid,
    bot_token,
    languages,
    caption_config,
    max_idle_seconds,
    session=None,
):
    """Sends the transcription bot into the channel. Returns its handle.

    `bot_token` is an ordinary RTC token minted for `bot_uid` by
    `agora.build_rtc_token` — the bot is a channel participant like any other
    and is refused without one on a project with an App Certificate, which is
    exactly what stops anybody else's bot listening to our classes. Agora
    documents it as required "only when your project has App Certificate
    enabled"; we always have one (nothing in this app can mint a token
    without it), so it is always sent.

    `subBotUid` / `subBotToken` are deprecated in v7 and documented as always
    identical to the publishing pair, so only the publishing pair is sent.
    The bot both listens and publishes: the words go out over the channel's
    data stream as live captions *and* into our bucket, and it is the bucket
    half this feature reads.
    """
    payload = {
        "name": name,
        "languages": list(languages),
        "maxIdleTime": max_idle_seconds,
        "rtcConfig": {
            "channelName": channel_name,
            # Agora's v7 reference types both bot uids as strings, and its own
            # examples quote them, even where older prose called them ints.
            "pubBotUid": str(bot_uid),
            "pubBotToken": bot_token,
        },
        "captionConfig": caption_config,
    }
    data = _request(
        "POST",
        _url(app_id, "join"),
        auth_header=auth_header,
        payload=payload,
        session=session,
    )
    agent_id = data.get("agent_id") or data.get("agentId")
    if not agent_id:
        logger.error("class_sessions: transcription join returned no agent_id: %s", describe(data))
        raise NotesUnavailableError("The transcription service didn't start a transcription.")
    return TranscriptionAgent(agent_id, name=name, status=str(data.get("status") or ""))


def query(*, app_id, auth_header, agent, session=None):
    """Asks how a running transcription is doing.

    Raises `NotesGoneError` once the bot has left, which is how a class that
    emptied out is noticed.
    """
    data = _request(
        "GET",
        _url(app_id, "agents", agent.agent_id),
        auth_header=auth_header,
        session=session,
        allow_gone=True,
    )
    agent.status = str(data.get("status") or "")
    return data


def leave(*, app_id, auth_header, agent, session=None):
    """Ends the transcription. The captions it wrote stay in the bucket."""
    return _request(
        "POST",
        _url(app_id, "agents", agent.agent_id, "leave"),
        auth_header=auth_header,
        session=session,
        allow_gone=True,
    )


def status_of(response):
    """The agent's own status out of a `query` response, upper-cased.

    Agora has shipped both `status` and, in older spellings, nothing at all
    while an agent is still being admitted — an empty string reads as "still
    going", which is the safe default.
    """
    return str((response or {}).get("status") or "").strip().upper()


def has_finished(response):
    """Whether Agora considers this agent done with the channel.

    STOPPED and FAILED are the two terminal states. Everything else — IDLE,
    STARTING, RUNNING, STOPPING, RECOVERING, an unrecognised value, or nothing
    at all — is treated as still going, because a bot we wrongly believe is
    dead is a transcript that stops in the middle of a class.
    """
    return status_of(response) in FINISHED_STATUSES


def describe(response):  # pragma: no cover - logging aid
    try:
        return json.dumps(response)[:500]
    except (TypeError, ValueError):
        return repr(response)[:500]
