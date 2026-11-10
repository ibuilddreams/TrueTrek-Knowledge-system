"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadClassNotesAudio } from "@/services/classSessionsService";

/**
 * Records a room, in its host's own browser, for its AI meeting notes.
 *
 * Used by both rooms this app runs — a live class and a War Room Live audio
 * session — because the recording is identical in each: the only thing that
 * differs is which server the segments are posted to, which is the
 * `uploadSegment` option.
 *
 * There is no transcription service and no bucket anywhere in the path: the
 * host's browser mixes everybody who is speaking into one track, records it
 * in segments and posts each one to this project's own server, where the
 * model reads it and writes the session up.
 *
 * Five things here are load-bearing.
 *
 * **It mixes rather than records one track.** Agora hands out a separate
 * audio track per person, and a MediaRecorder can only have one — so every
 * track is connected into a single `MediaStreamAudioDestinationNode` and the
 * recorder runs on that. A person who joins or leaves mid-session is
 * connected or dropped as they do, which is why the source list is re-synced
 * on every change to `remoteUsers` rather than built once at the start.
 *
 * **Muting replaces a track, it does not silence one.** Agora's
 * `setEnabled(false)` releases the microphone, and turning it back on
 * acquires a *new* `MediaStreamTrack`. Sources are therefore keyed by the
 * underlying track's own id, so an unmute connects the new track instead of
 * leaving a dead node in the mix.
 *
 * **Segments, not one file at the end.** A session is cut into slices on a
 * timer and each is uploaded as it completes. A browser that crashes loses
 * the slice in progress rather than the hour, the final upload is seconds
 * rather than minutes, and the model is handed minutes of audio per call
 * however long the session ran.
 *
 * **Uploads are serialised and idempotent.** They go up one at a time, in the
 * order they were recorded, each under a key of its own — so a retry after a
 * timeout is recognised by the server as the same segment rather than stored
 * as a second copy of the same five minutes.
 *
 * **It writes down who is speaking, because nothing downstream can work it
 * out.** What the model receives is one mixed track, and no amount of
 * listening to a mix tells you which of three voices is Ali's. This hook is
 * the only place that knows — it holds every participant's track separately,
 * a moment before they are added together — so it watches each one's level
 * and records the changes as `{at, uid}`. The server resolves those uids
 * against the room's roster and hands the model the answer rather than asking
 * it to guess, because a sentence filed under the wrong person's name is
 * worse than one filed under nobody's.
 *
 * **Stopping is awaited, not fired off.** `stopAndFlush` resolves only once
 * the last segment has actually gone up. The room awaits it before telling
 * the server its host has left — and `stopAndFlush({end: true})` is what
 * tells the server the session is *over*, as opposed to merely paused
 * between two stretches of one session.
 */

// Fallbacks for a server that did not say. Kept in step with
// `notes_capture_config` on whichever server owns the room, which is where
// the real values come from — the server has to accept what the browser
// records, so the numbers belong beside the code that validates them.
const DEFAULT_SEGMENT_SECONDS = 600;
const DEFAULT_AUDIO_BITRATE = 16000;
const DEFAULT_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

// A blob this small is an empty container header and nothing else — what a
// recorder stopped in the same second it started produces. Matches
// `class_sessions/notes_audio.MIN_SEGMENT_BYTES`, which both servers use.
const MIN_SEGMENT_BYTES = 1024;

// How often each voice's level is sampled, and how loud counts as speaking.
// Four times a second is finer than anybody changes turn, and the
// threshold is well above a quiet room but below a soft voice — this decides
// who gets the line, so a miss costs a name while a false positive costs the
// wrong one.
const SPEAKER_SAMPLE_MS = 250;
const SPEAKER_LEVEL_THRESHOLD = 0.02;

// One retry per segment, after a pause. A room's uplink drops a request now
// and then and the segment is still sitting in memory, so trying once more is
// nearly free; trying forever would queue a session's worth of audio behind
// one bad minute.
const UPLOAD_RETRY_DELAY_MS = 4000;

// How many segments in a row have to get nowhere before the host is told.
// Two, because the commonest cause is not a blip at all — it is a reverse
// proxy refusing the body size, which fails every upload identically and
// otherwise shows up only as a session that mysteriously produced no notes.
const UPLOAD_FAILURES_BEFORE_WARNING = 2;

function pickMimeType(candidates) {
  if (typeof MediaRecorder === "undefined") return null;
  const wanted = candidates?.length ? candidates : DEFAULT_MIME_TYPES;
  for (const type of wanted) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      // Older implementations throw on an unknown type rather than saying no.
    }
  }
  return null;
}

function randomKey() {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function useRoomAudioRecorder({
  sessionId,
  active = false,
  // Where a finished segment goes. Defaults to the live classes, which is
  // where this hook started; War Room Live passes its own. Everything else
  // about a recording is the same in both rooms, which is why this is one
  // argument rather than a second copy of this file.
  uploadSegment = uploadClassNotesAudio,
  // A new run means a new session's worth of audio: the recorder is torn
  // down and rebuilt rather than carried over, so segments can never be
  // filed against the run before this one.
  runId = null,
  segmentSeconds,
  audioBitrate,
  mimeTypes,
  localAudioTrack = null,
  localUid = null,
  isMicOn = true,
  remoteUsers = [],
} = {}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);

  const contextRef = useRef(null);
  const destinationRef = useRef(null);
  const sourcesRef = useRef(new Map());
  const recorderRef = useRef(null);
  const rotateTimerRef = useRef(null);
  // Uploads are chained rather than fired in parallel so a class's segments
  // arrive in the order they were spoken, and so `stopAndFlush` has one thing
  // to await.
  const uploadChainRef = useRef(Promise.resolve());
  const runningRef = useRef(false);
  const sessionIdRef = useRef(sessionId);
  // Which recording this is. `stopAndFlush` has to wait for an upload before
  // it can take the mixer down, and in that time a new one can have started —
  // React's development double-mount does exactly that, and so does a
  // teacher stopping and restarting the notes. Without this, the old stop
  // would close the new recording's audio context out from under it.
  const generationRef = useRef(0);
  // Consecutive uploads that got nowhere. Reset by any success, because a
  // single dropped request on a classroom uplink is ordinary.
  const failedUploadsRef = useRef(0);
  // One analyser per connected voice, keyed exactly as `sourcesRef` is, so
  // the two lists are added to and dropped from together.
  const analysersRef = useRef(new Map());
  // Who was speaking during the segment being recorded now, and when. Reset
  // with every segment, because `at` is measured from that segment's start.
  const speakersRef = useRef([]);
  const speakerTimerRef = useRef(null);
  const segmentStartedAtRef = useRef(0);
  // Held in a ref for the same reason `sessionId` is: an upload is retried
  // minutes after the render that queued it, and a closure over a stale
  // function would post a session's audio to the wrong server.
  const uploadSegmentRef = useRef(uploadSegment);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    uploadSegmentRef.current = uploadSegment;
  }, [uploadSegment]);

  const upload = useCallback(async (blob, { durationSeconds, end, speakers }) => {
    const clientKey = randomKey();
    const id = sessionIdRef.current;
    if (!id) return;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await uploadSegmentRef.current(id, {
          blob,
          clientKey,
          durationSeconds,
          end,
          speakers,
        });
        failedUploadsRef.current = 0;
        return;
      } catch (uploadError) {
        // 409 means the server is no longer taking audio for this class —
        // the run was stopped from somewhere else, or finished while this was
        // in flight. Retrying would only fail again, and it is not a fault.
        if (uploadError?.status === 409 || uploadError?.status === 403) {
          return;
        }
        if (attempt === 0) {
          await wait(UPLOAD_RETRY_DELAY_MS);
          continue;
        }

        console.warn("Meeting notes audio upload failed", uploadError);
        failedUploadsRef.current += 1;
        // One lost slice is a blip and nobody should hear about it. Several
        // in a row is a session that will end with nothing to write up — a
        // proxy rejecting the body size, most often — and the host needs to
        // know while there is still something left to save.
        if (failedUploadsRef.current === UPLOAD_FAILURES_BEFORE_WARNING) {
          setError(
            "The room's audio isn't reaching the server, so there may be no notes from this session. Check with whoever runs it.",
          );
        }
      }
    }
  }, []);

  const queueUpload = useCallback(
    (blob, { durationSeconds, end, speakers }) => {
      if (!blob || blob.size < MIN_SEGMENT_BYTES) return uploadChainRef.current;
      uploadChainRef.current = uploadChainRef.current
        .catch(() => undefined)
        .then(() => upload(blob, { durationSeconds, end, speakers }));
      return uploadChainRef.current;
    },
    [upload],
  );

  /**
   * Notes down who is speaking, if anybody, and only when that changes.
   *
   * Loudest-above-a-threshold rather than everyone-above-a-threshold: in a
   * full room somebody is always breathing into a microphone, and a turn belongs
   * to the person actually talking. A tie, a silence or a room where two
   * people are over each other leaves a gap, which the model is told to
   * render as "Speaker" rather than filling in.
   */
  const sampleSpeakers = useCallback(() => {
    let loudestUid = null;
    let loudest = SPEAKER_LEVEL_THRESHOLD;

    analysersRef.current.forEach(({ uid, analyser, buffer }) => {
      if (uid == null) return;
      try {
        analyser.getByteTimeDomainData(buffer);
      } catch {
        return;
      }
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const deviation = (buffer[i] - 128) / 128;
        sum += deviation * deviation;
      }
      const level = Math.sqrt(sum / buffer.length);
      if (level > loudest) {
        loudest = level;
        loudestUid = uid;
      }
    });

    const timeline = speakersRef.current;
    const previous = timeline.length ? timeline[timeline.length - 1].uid : null;
    // Only the changes: the server collapses repeats anyway, and a line
    // every quarter second would be most of what the model has to read.
    if (loudestUid == null || loudestUid === previous) return;
    timeline.push({
      at: Math.max(0, (Date.now() - segmentStartedAtRef.current) / 1000),
      uid: loudestUid,
    });
  }, []);

  /**
   * Starts one segment, and schedules the next.
   *
   * Each segment is its own `MediaRecorder` rather than a timesliced one,
   * because only a complete recording is a complete file: the chunks a
   * timeslice yields share a single container header and are unreadable on
   * their own.
   */
  const startSegment = useCallback(() => {
    const destination = destinationRef.current;
    if (!destination || !runningRef.current) return;

    const type = pickMimeType(mimeTypes);
    let recorder;
    try {
      recorder = new MediaRecorder(
        destination.stream,
        type
          ? { mimeType: type, audioBitsPerSecond: audioBitrate || DEFAULT_AUDIO_BITRATE }
          : { audioBitsPerSecond: audioBitrate || DEFAULT_AUDIO_BITRATE },
      );
    } catch (recorderError) {
      runningRef.current = false;
      setIsCapturing(false);
      setError(
        "This browser can't record the room for its notes. Chrome, Edge, Firefox and Safari can.",
      );
      console.warn("Meeting notes recorder could not start", recorderError);
      return;
    }

    const chunks = [];
    const startedAt = Date.now();
    // `at` is measured from this segment's start, so the record starts
    // empty with it — and whoever is already mid-sentence is picked up on
    // the next sample a quarter of a second later.
    speakersRef.current = [];
    segmentStartedAtRef.current = startedAt;
    // Resolved by `onstop`, so a flush can await the data actually arriving
    // rather than guessing at a tick.
    let settle;
    recorder.__finished = new Promise((resolve) => {
      settle = resolve;
    });
    recorder.__end = false;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || type || "audio/webm" });
      queueUpload(blob, {
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        end: recorder.__end === true,
        speakers: recorder.__speakers || [],
      });
      settle();
    };

    recorderRef.current = recorder;
    try {
      recorder.start();
      // Captured onto the recorder rather than read from the ref inside
      // `onstop`: by the time that fires the next segment has already
      // cleared the ref for its own turn.
      recorder.__speakers = speakersRef.current;
    } catch (startError) {
      settle();
      console.warn("Meeting notes recorder refused to start", startError);
      return;
    }

    rotateTimerRef.current = setTimeout(
      () => {
        if (recorderRef.current !== recorder || !runningRef.current) return;
        try {
          recorder.stop();
        } catch {
          // Already inactive.
        }
        startSegment();
      },
      Math.max(30, segmentSeconds || DEFAULT_SEGMENT_SECONDS) * 1000,
    );
  }, [audioBitrate, mimeTypes, queueUpload, segmentSeconds]);

  const teardownGraph = useCallback(() => {
    sourcesRef.current.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Already disconnected.
      }
    });
    sourcesRef.current.clear();
    analysersRef.current.clear();
    clearInterval(speakerTimerRef.current);
    speakerTimerRef.current = null;
    destinationRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") {
      // Nothing here owns a device — the tracks belong to the call — so this
      // only releases the mixer itself.
      context.close().catch(() => undefined);
    }
  }, []);

  /**
   * Ends the recording and waits for the last segment to be on the server.
   *
   * `end` is the difference between a pause and the end of the session, and
   * it travels with the closing segment because that upload is what starts
   * the write-up. The stop button passes nothing (a pause: the audio stays on
   * the run and the next stretch appends to it); leaving and the room closing
   * itself pass `{end: true}`.
   *
   * Safe to call when nothing is running, and safe to call twice: the room
   * calls it from the stop button, from leaving, and again when the server
   * says the run has ended.
   */
  const stopAndFlush = useCallback(async ({ end = false } = {}) => {
    const generation = generationRef.current;
    // Held onto so a stop that is overtaken by a new recording can still
    // release its *own* mixer without touching the one that replaced it.
    const context = contextRef.current;
    const wasRunning = runningRef.current;
    runningRef.current = false;
    clearTimeout(rotateTimerRef.current);
    rotateTimerRef.current = null;

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.__end = end;
      try {
        recorder.stop();
      } catch {
        // Already stopped; `onstop` has run or will not run.
      }
      await recorder.__finished;
    }

    try {
      await uploadChainRef.current;
    } catch {
      // Already logged inside `upload`.
    }

    if (generationRef.current !== generation) {
      // A recording started while this one was finishing, and the refs point
      // at its mixer now — so only this stop's own context is released.
      if (context && context.state !== "closed") {
        context.close().catch(() => undefined);
      }
      return;
    }

    teardownGraph();
    if (wasRunning) setIsCapturing(false);
  }, [teardownGraph]);

  // Start and stop with the run. Keyed on `runId` as well as `active` so a
  // session that is stopped and started again records into the right run
  // rather than carrying the old recorder across.
  useEffect(() => {
    if (!active) {
      stopAndFlush();
      return undefined;
    }

    const AudioContextClass =
      typeof window !== "undefined" &&
      (window.AudioContext || window.webkitAudioContext);
    if (!AudioContextClass || typeof MediaRecorder === "undefined") {
      setError(
        "This browser can't record the room for its notes. Chrome, Edge, Firefox and Safari can.",
      );
      return undefined;
    }

    setError(null);
    generationRef.current += 1;
    // Any node still listed belongs to a context that has been replaced:
    // dropped rather than disconnected, since closing that context took them
    // with it.
    sourcesRef.current.clear();
    const context = new AudioContextClass();
    contextRef.current = context;
    destinationRef.current = context.createMediaStreamDestination();
    // A context created outside a gesture can start suspended; the teacher
    // pressed a button to get here, so this resolves immediately in practice.
    context.resume?.().catch(() => undefined);

    runningRef.current = true;
    setIsCapturing(true);
    startSegment();
    speakerTimerRef.current = setInterval(sampleSpeakers, SPEAKER_SAMPLE_MS);

    return () => {
      stopAndFlush();
    };
    // `startSegment` and `stopAndFlush` are stable for the life of a run;
    // re-running this on their identity would restart the recording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, runId]);

  // Keep the mix in step with who is actually speaking. Runs on every change
  // to the call's tracks, which is also how an unmuted microphone's *new*
  // MediaStreamTrack finds its way in (see the hook's docstring).
  useEffect(() => {
    const context = contextRef.current;
    const destination = destinationRef.current;
    if (!isCapturing || !context || !destination) return;

    const wanted = new Map();
    const add = (prefix, uid, track) => {
      const media = track?.getMediaStreamTrack?.();
      if (media && media.readyState === "live") {
        wanted.set(`${prefix}:${media.id}`, { media, uid });
      }
    };

    if (isMicOn) add("local", localUid, localAudioTrack);
    (remoteUsers || []).forEach((user) =>
      add(`remote-${user.uid}`, user.uid, user.audioTrack),
    );

    wanted.forEach(({ media, uid }, key) => {
      if (sourcesRef.current.has(key)) return;
      try {
        const source = context.createMediaStreamSource(new MediaStream([media]));
        source.connect(destination);
        sourcesRef.current.set(key, source);

        // A second, parallel tap on the same voice. It is deliberately not
        // connected onwards: an analyser is a listening post, and wiring it
        // into the destination would add every voice to the mix twice.
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analysersRef.current.set(key, {
          uid,
          analyser,
          buffer: new Uint8Array(analyser.fftSize),
        });
      } catch (mixError) {
        console.warn("Could not add a voice to the meeting notes mix", mixError);
      }
    });

    [...sourcesRef.current.keys()].forEach((key) => {
      if (wanted.has(key)) return;
      try {
        sourcesRef.current.get(key).disconnect();
      } catch {
        // Already gone with its track.
      }
      sourcesRef.current.delete(key);
      analysersRef.current.delete(key);
    });
  }, [isCapturing, isMicOn, localAudioTrack, localUid, remoteUsers]);

  return { isCapturing, error, stopAndFlush };
}
