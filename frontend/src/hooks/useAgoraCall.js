"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AGORA_APP_ID } from "@/config/env";
import {
  joinClassSession,
  leaveClassSession,
} from "@/services/classSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";

/**
 * Owns one Agora RTC call for one class session.
 *
 * Everything to do with the SDK lives here so the classroom components stay
 * ordinary React: they render `remoteUsers` and call the returned actions,
 * and never touch an Agora object directly.
 *
 * The server is the only source of a channel name and a token
 * (`joinClassSession` → class_sessions/services.py::issue_join_credentials),
 * which is also why renewal is just that same call again — there is no
 * separate "refresh token" route to keep in step.
 */

export const CALL_STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
};

// The SDK reads `window` while it initialises, so it is imported lazily, on
// the browser, at the moment of joining — a top-level import crashes the
// server render of any page that merely mounts this hook. Cached, so the
// second class of a session doesn't re-download it.
let sdkPromise = null;
function loadAgora() {
  if (!sdkPromise) {
    sdkPromise = import("agora-rtc-sdk-ng").then((module) => module.default || module);
  }
  return sdkPromise;
}

// Agora's own log levels. `setLogLevel` is global to the SDK, so it is only
// ever turned down around a single call and put straight back.
const AGORA_LOG_LEVEL_WARNING = 2;
const AGORA_LOG_LEVEL_NONE = 4;

/**
 * Whether this client is actually in the channel.
 *
 * `clientRef.current` is set before `join` completes and the connection can
 * drop at any time afterwards, so the object existing says nothing about
 * whether it can publish — asking it anyway throws INVALID_OPERATION.
 */
function canPublish(client) {
  return Boolean(client) && client.connectionState === "CONNECTED";
}

/**
 * An operation we cancelled ourselves, not a failure to report.
 *
 * Queueing join behind leave (see `enqueue`) is what stops these happening in
 * the first place; this is the safety net for a connection torn down by
 * something outside that queue, such as the page being closed mid-join.
 */
function isAbortError(error) {
  const code = error?.code || error?.name;
  return code === "WS_ABORT" || code === "OPERATION_ABORTED" || code === "AbortError";
}

/** Dismissing the screen picker — a normal outcome, not a failure. */
function isPickerCancelled(error) {
  return error?.code === "PERMISSION_DENIED" || error?.name === "NotAllowedError";
}

/** Agora reports problems as codes; these are the ones a user can act on. */
function describeJoinError(error) {
  const code = error?.code || error?.name;
  if (code === "PERMISSION_DENIED" || code === "NotAllowedError") {
    return "Your browser blocked access to the camera and microphone. Allow them in the address bar, then try again.";
  }
  if (code === "NotFoundError" || code === "DEVICE_NOT_FOUND") {
    return "No camera or microphone was found on this device.";
  }
  if (code === "NotReadableError") {
    return "Your camera or microphone is being used by another app. Close it and try again.";
  }
  if (code === "CAN_NOT_GET_GATEWAY_SERVER" || code === "INVALID_PARAMS") {
    return "The classroom rejected this connection. Ask your teacher to reopen the class.";
  }
  if (code === "WEB_SECURITY_RESTRICT") {
    return "Live classes need a secure connection (https) or localhost.";
  }
  return error?.message || "Could not connect to the classroom.";
}

export function useAgoraCall(sessionId) {
  const [status, setStatus] = useState(CALL_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [roster, setRoster] = useState([]);
  const [localUid, setLocalUid] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  // Present only while the camera is live; the local tile renders it directly.
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [activeSpeakerUid, setActiveSpeakerUid] = useState(null);

  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const screenTrackRef = useRef(null);
  // Joining and leaving are queued rather than allowed to overlap. An Agora
  // client cannot be torn down while it is still negotiating: `leave()` during
  // `join()` aborts the SDK's websocket, which it reports as "User join
  // failed … WS_ABORT" — and React's development double-mount does exactly
  // that, mounting, joining, unmounting and leaving within a frame. Waiting
  // for the connection to settle before tearing it down means that abort
  // never happens, instead of being caught and explained away afterwards.
  const operationRef = useRef(null);
  // The screen picker is open for as long as the user takes to choose, so a
  // second tap on the button must not start a second share.
  const screenShareBusyRef = useRef(false);
  const sessionIdRef = useRef(sessionId);
  // Read by `stopScreenShare`, which is also bound to the browser's own "Stop
  // sharing" bar at the moment sharing starts — a closure would freeze the
  // camera state as it was back then.
  const isCameraOnRef = useRef(true);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    isCameraOnRef.current = isCameraOn;
  }, [isCameraOn]);

  const syncRemoteUsers = useCallback(() => {
    const client = clientRef.current;
    // A new array identity each time: the SDK mutates the user objects in
    // place, so React would otherwise never see a track appear.
    setRemoteUsers(client ? [...client.remoteUsers] : []);
  }, []);

  const releaseLocalTracks = useCallback(() => {
    [micTrackRef, cameraTrackRef, screenTrackRef].forEach((ref) => {
      if (ref.current) {
        ref.current.stop();
        ref.current.close();
        ref.current = null;
      }
    });
    setLocalVideoTrack(null);
  }, []);

  /**
   * Runs `task` after every join/leave already queued has settled.
   *
   * The queue is never left in a rejected state, or every later operation
   * would be skipped over — a failed join must not make the call impossible
   * to leave.
   */
  const enqueue = useCallback((task) => {
    const previous = operationRef.current || Promise.resolve();
    const next = previous.then(task, task);
    operationRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

  const runLeave = useCallback(
    // `nextStatus` exists because tearing a failed call down must not erase
    // the reason it failed: a plain leave lands on IDLE, while the two
    // failure paths below hand over to ERROR so the panel stays on screen.
    async ({ notifyServer = true, nextStatus = CALL_STATUS.IDLE } = {}) => {
      const client = clientRef.current;
      // Nothing to report if we never got as far as a client — a join that
      // was refused, or that found no camera or microphone, never entered the
      // room, and a "left" ping would stamp a departure on a class nobody
      // walked into.
      const hadJoined = Boolean(client);
      releaseLocalTracks();

      if (client) {
        try {
          await client.leave();
        } catch {
          // Already disconnected — nothing left to tidy up on this side.
        }
        client.removeAllListeners();
        clientRef.current = null;
      }

      setRemoteUsers([]);
      setIsSharingScreen(false);
      setActiveSpeakerUid(null);
      setStatus(nextStatus);

      if (notifyServer && hadJoined && sessionIdRef.current) {
        try {
          await leaveClassSession(sessionIdRef.current);
        } catch {
          // Best-effort attendance ping — a failure here must not stop a
          // student from closing the classroom.
        }
      }
    },
    [releaseLocalTracks],
  );

  const leave = useCallback((options) => enqueue(() => runLeave(options)), [enqueue, runLeave]);

  const runJoin = useCallback(async () => {
    // Already in the room — a second "Join" (or the remount half of React's
    // double-mount, which queues behind the first) is a no-op.
    if (clientRef.current) return;
    setStatus(CALL_STATUS.CONNECTING);
    setError(null);

    let credentials;
    try {
      const response = await joinClassSession(sessionId);
      credentials = response?.data;
    } catch (joinError) {
      setStatus(CALL_STATUS.ERROR);
      setError(getApiErrorMessage(joinError, "This class isn't open to join yet."));
      return;
    }

    if (!AGORA_APP_ID) {
      setStatus(CALL_STATUS.ERROR);
      setError(
        "Live classes aren't configured in this app (NEXT_PUBLIC_AGORA_APP_ID is missing).",
      );
      return;
    }

    try {
      const AgoraRTC = await loadAgora();
      AgoraRTC.setLogLevel(AGORA_LOG_LEVEL_WARNING);

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        try {
          await client.subscribe(user, mediaType);
        } catch {
          // A publisher that left between the event and the subscribe.
          return;
        }
        // Audio plays into the page itself; video is attached to a tile by
        // the component that renders it.
        if (mediaType === "audio") user.audioTrack?.play();
        syncRemoteUsers();
      });

      client.on("user-unpublished", syncRemoteUsers);
      client.on("user-joined", syncRemoteUsers);
      client.on("user-left", syncRemoteUsers);

      // Agora warns 30s before a token dies. Asking the server for a fresh
      // one is the same call as joining, and it re-checks the clock and the
      // roster — a class that has ended simply isn't renewed.
      client.on("token-privilege-will-expire", async () => {
        try {
          const refreshed = await joinClassSession(sessionIdRef.current);
          await client.renewToken(refreshed?.data?.token);
        } catch {
          // Nothing to do yet; `did-expire` below handles the fallout.
        }
      });

      client.on("token-privilege-did-expire", () => {
        setError("Your classroom pass expired. Re-join to continue.");
        leave({ notifyServer: false, nextStatus: CALL_STATUS.ERROR });
      });

      client.enableAudioVolumeIndicator();
      client.on("volume-indicator", (volumes) => {
        const loudest = volumes.reduce(
          (top, entry) => (entry.level > (top?.level ?? 0) ? entry : top),
          null,
        );
        setActiveSpeakerUid(loudest && loudest.level > 5 ? loudest.uid : null);
      });

      await client.join(
        AGORA_APP_ID,
        credentials.channel_name,
        credentials.token,
        credentials.uid,
      );

      setLocalUid(credentials.uid);
      setRoster(credentials.roster || []);

      // Microphone and camera are requested separately so that a student with
      // no webcam — or who denied only the camera — still joins and can talk,
      // instead of being thrown out of the class entirely.
      let publishable = [];
      try {
        micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        publishable.push(micTrackRef.current);
        setIsMicOn(true);
      } catch {
        setIsMicOn(false);
      }
      try {
        cameraTrackRef.current = await AgoraRTC.createCameraVideoTrack();
        publishable.push(cameraTrackRef.current);
        setLocalVideoTrack(cameraTrackRef.current);
        setIsCameraOn(true);
      } catch {
        setIsCameraOn(false);
      }

      if (!publishable.length) {
        throw Object.assign(new Error("No camera or microphone available."), {
          code: "PERMISSION_DENIED",
        });
      }

      await client.publish(publishable);
      syncRemoteUsers();
      setStatus(CALL_STATUS.CONNECTED);
    } catch (callError) {
      // `runLeave`, not the queued `leave`: this already *is* the queued
      // operation, so queueing the teardown behind itself would deadlock.
      if (isAbortError(callError)) {
        // The connection was torn down on purpose while it was still being
        // made. Nothing failed, so nothing is reported — just tidy up.
        await runLeave({ notifyServer: false, nextStatus: CALL_STATUS.IDLE });
        return;
      }
      setError(describeJoinError(callError));
      await runLeave({ notifyServer: false, nextStatus: CALL_STATUS.ERROR });
    }
  }, [sessionId, runLeave, leave, syncRemoteUsers]);

  const join = useCallback(() => enqueue(runJoin), [enqueue, runJoin]);

  const toggleMic = useCallback(async () => {
    const track = micTrackRef.current;
    if (!track) return;
    const next = !isMicOn;
    await track.setEnabled(next);
    setIsMicOn(next);
  }, [isMicOn]);

  const toggleCamera = useCallback(async () => {
    const track = cameraTrackRef.current;
    if (!track) return;
    const next = !isCameraOn;
    await track.setEnabled(next);
    setIsCameraOn(next);
    // A disabled track renders a frozen frame, so the tile is told to show
    // the avatar placeholder instead — unless a screen share is on the wall,
    // in which case the local tile is the screen and must not be cleared.
    if (!isSharingScreen) setLocalVideoTrack(next ? track : null);
  }, [isCameraOn, isSharingScreen]);

  /** Puts the camera back on the wall, if it was on before sharing. */
  const restoreCamera = useCallback(async () => {
    const client = clientRef.current;
    if (!cameraTrackRef.current || !isCameraOnRef.current || !canPublish(client)) {
      // Either there is no camera to go back to, or the call has ended — in
      // both cases the tile has to be cleared, because the screen track it
      // was showing is closed by now.
      setLocalVideoTrack(null);
      return;
    }
    try {
      await client.publish(cameraTrackRef.current);
      setLocalVideoTrack(cameraTrackRef.current);
    } catch {
      // The call ended underneath us; nothing to show.
      setLocalVideoTrack(null);
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current;
    const screenTrack = screenTrackRef.current;
    if (!screenTrack) return;

    if (client) {
      try {
        await client.unpublish(screenTrack);
      } catch {
        // Already unpublished, or the call has ended.
      }
    }
    screenTrack.stop();
    screenTrack.close();
    screenTrackRef.current = null;
    setIsSharingScreen(false);

    await restoreCamera();
  }, [restoreCamera]);

  const startScreenShare = useCallback(async () => {
    const client = clientRef.current;
    // A client that is still connecting — or has since left the channel —
    // rejects `publish` with INVALID_OPERATION from deep inside the SDK, so
    // the connection is checked here rather than assumed from the button
    // being on screen. `screenShareBusyRef` covers a double-tap, which would
    // otherwise open two pickers and leak the first capture.
    if (!canPublish(client) || screenShareBusyRef.current) return;
    screenShareBusyRef.current = true;

    let screenTrack = null;
    let cameraTakenDown = false;

    try {
      const AgoraRTC = await loadAgora();

      try {
        // The SDK logs a cancelled picker at ERROR level, which in
        // development puts a full-screen crash overlay in front of an
        // ordinary user action. Only this one call is silenced, and a real
        // failure is still reported — both to the user and to the console in
        // the catch below.
        AgoraRTC.setLogLevel(AGORA_LOG_LEVEL_NONE);
        screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        });
      } finally {
        AgoraRTC.setLogLevel(AGORA_LOG_LEVEL_WARNING);
      }

      // Agora hands back an array when audio sharing is on; this call asks
      // for video only, but guard anyway.
      screenTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

      // Choosing a window is a human-speed action: the class can end, the
      // connection can drop, or the classroom can be closed while the picker
      // is open. Nothing is on the wall yet, so the capture is simply
      // released rather than published onto a client that has moved on.
      if (clientRef.current !== client || !canPublish(client)) {
        screenTrack.stop();
        screenTrack.close();
        return;
      }

      screenTrackRef.current = screenTrack;

      // One video track at a time: the camera comes down while the screen is
      // up, which is also what keeps the uplink inside a classroom's budget.
      if (cameraTrackRef.current) {
        try {
          await client.unpublish(cameraTrackRef.current);
          cameraTakenDown = true;
        } catch {
          // Wasn't published — nothing to take down.
        }
      }

      await client.publish(screenTrack);
      setLocalVideoTrack(screenTrack);
      setIsSharingScreen(true);

      // The browser's own "Stop sharing" bar bypasses our button entirely.
      screenTrack.on("track-ended", () => {
        stopScreenShare();
      });
    } catch (shareError) {
      // Whatever went wrong, the capture must not be left running and the
      // teacher must not be left off the wall because we took their camera
      // down for a share that never started.
      if (screenTrack) {
        screenTrack.stop();
        screenTrack.close();
      }
      screenTrackRef.current = null;
      setIsSharingScreen(false);
      if (cameraTakenDown) await restoreCamera();

      if (!isPickerCancelled(shareError)) {
        // Silenced in the SDK's own log above, so keep a copy for debugging.
        console.warn("Screen share failed", shareError);
        setError(describeJoinError(shareError));
      }
    } finally {
      screenShareBusyRef.current = false;
    }
  }, [restoreCamera, stopScreenShare]);

  const toggleScreenShare = useCallback(() => {
    return isSharingScreen ? stopScreenShare() : startScreenShare();
  }, [isSharingScreen, startScreenShare, stopScreenShare]);

  // Closing the tab, navigating away, or unmounting the classroom must all
  // release the camera — a hot webcam light after leaving a class is both
  // alarming and a real privacy problem.
  useEffect(() => {
    return () => {
      leave({ notifyServer: true });
    };
    // Intentionally mount-only: `leave` reads everything it needs from refs,
    // and re-running this on every re-render would end the call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    error,
    join,
    leave,
    remoteUsers,
    roster,
    localUid,
    localVideoTrack,
    isMicOn,
    isCameraOn,
    isSharingScreen,
    activeSpeakerUid,
    hasMic: Boolean(micTrackRef.current),
    hasCamera: Boolean(cameraTrackRef.current),
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    clearError: () => setError(null),
  };
}
