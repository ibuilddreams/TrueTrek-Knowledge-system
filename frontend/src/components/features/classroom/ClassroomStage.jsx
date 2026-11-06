"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Circle, NotebookPen, Radio } from "lucide-react";
import FullScreenPortal from "@/components/features/portal/lesson-view/FullScreenPortal";
import PingDotSpinner from "@/components/ui/PingDotSpinner";
import { useAgoraCall, CALL_STATUS } from "@/hooks/useAgoraCall";
import { useClassNotes, useClassNotesControls } from "@/hooks/useClassNotes";
import { useClassNotesRecorder } from "@/hooks/useClassNotesRecorder";
import { useClassroomClosing } from "@/hooks/useClassroomClosing";
import {
  useClassRecording,
  useClassRecordingControls,
} from "@/hooks/useClassRecording";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import ClassroomControls from "./ClassroomControls";
import ClassroomParticipantsPanel from "./ClassroomParticipantsPanel";
import VideoTile from "./VideoTile";
import WhiteboardPanel from "./WhiteboardPanel";
import { formatClassTime } from "./classSessionUtils";

/**
 * The classroom itself — one full-screen Agora call for one class session,
 * used unchanged by the teacher portal and the student portal (the same way
 * `WarRoomScreen` serves both sides of a course chat).
 *
 * It is deliberately a portal to <body> rather than a tab panel: a call that
 * unmounts when a tab changes is a call that drops, and a `position: fixed`
 * overlay inside the portals' animated containers would be trapped in them
 * (see FullScreenPortal).
 *
 * The whiteboard takes the stage when it is open and the faces drop to a
 * strip along the bottom, because that is the order of attention in a class
 * being presented to: what is being explained is the board, and the people
 * are context. Closing it puts the spotlight back exactly as it was — the
 * call is untouched either way, since the board is a separate connection
 * with its own credential (`useWhiteboard`).
 */
export default function ClassroomStage({ session, onClose }) {
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const call = useAgoraCall(session.id);
  const { join, leave, status } = call;

  // Whether the class is being recorded is the server's answer, not the
  // browser's: the recorder is a participant Agora puts in the channel, and
  // the teacher can start or stop it from another device. Polled only while
  // connected, and seeded by what the join call already said, so the REC
  // indicator is right on the very first frame rather than a poll later.
  const recording = useClassRecording(session.id, {
    poll: status === CALL_STATUS.CONNECTED,
  });
  const recordingControls = useClassRecordingControls(session.id);
  const isRecording = recording.data
    ? Boolean(recording.data.is_recording)
    : call.wasRecordingAtJoin;
  const isRecordingProcessing = Boolean(recording.data?.is_processing);

  // Notes are fetched separately from the recording and never derived from
  // it: different feature, different bill, different per-class switch — so a
  // class can be written up and not filmed, filmed and not written up, or
  // one of the two can be unavailable on this server while the other works.
  // They do not even share a source: a recording always comes from Agora,
  // while the notes are written from whatever this server is configured to
  // listen with (`capture.mode` below).
  const notes = useClassNotes(session.id, {
    poll: status === CALL_STATUS.CONNECTED,
  });
  const notesControls = useClassNotesControls(session.id);
  const isTakingNotes = notes.data
    ? Boolean(notes.data.is_transcribing)
    : call.wasTakingNotesAtJoin;
  const isWritingNotes = Boolean(notes.data?.is_writing);

  // On a server that writes classes up from their own audio rather than from
  // a transcription service, the recorder *is this browser* — but only for
  // the one person the run nominated. Everybody else in the class watches the
  // same "notes are being taken" badge and records nothing, which is what
  // stops a co-instructor's classroom posting a second copy of the hour.
  // The join payload answers this too, and answers it first — the notes
  // query is a second request racing the same page load, and the seconds
  // between them are the start of the lesson. Whichever has arrived wins,
  // with the polled answer taking over once it has.
  const notesCapture = notes.data?.capture || call.notesCaptureAtJoin || null;
  const isNotesCapturer =
    notesCapture?.mode === "local" &&
    call.localUid != null &&
    notesCapture.capturer_id === call.localUid;

  const notesRecorder = useClassNotesRecorder({
    sessionId: session.id,
    active:
      isNotesCapturer && isTakingNotes && status === CALL_STATUS.CONNECTED,
    runId: notesCapture?.run_id ?? null,
    segmentSeconds: notesCapture?.segment_seconds,
    audioBitrate: notesCapture?.audio_bitrate,
    mimeTypes: notesCapture?.mime_types,
    localAudioTrack: call.localAudioTrack,
    // The uid the recorder files the teacher's own turns under — the same
    // number the roster names them by, which is what lets the transcript say
    // "Michael:" instead of "Speaker:".
    localUid: call.localUid,
    isMicOn: call.isMicOn,
    remoteUsers: call.remoteUsers,
  });

  const handleToggleRecording = async () => {
    const mutation = isRecording ? recordingControls.stop : recordingControls.start;
    try {
      const response = await mutation.mutateAsync();
      toastSuccess(
        response?.message ||
          (isRecording ? "Recording stopped." : "Recording started."),
      );
    } catch (error) {
      toastError(
        getApiErrorMessage(
          error,
          isRecording
            ? "Couldn't stop the recording."
            : "Couldn't start recording this class.",
        ),
      );
    }
  };

  const handleToggleNotes = async () => {
    // Stopping mid-class is a **pause**, not the end of the notes: the last
    // piece of audio goes up without `end`, so it joins everything else on
    // this run and the next stretch appends to it. One class taken in two
    // sittings comes out as one set of notes. Awaited, not fired off — the
    // segment has to be on the server before the server is told to park it.
    if (isTakingNotes) {
      await notesRecorder.stopAndFlush();
    }
    const mutation = isTakingNotes ? notesControls.stop : notesControls.start;
    try {
      const response = await mutation.mutateAsync();
      toastSuccess(
        response?.message ||
          (isTakingNotes ? "Notes stopped." : "Taking notes."),
      );
    } catch (error) {
      toastError(
        getApiErrorMessage(
          error,
          isTakingNotes
            ? "Couldn't stop taking notes."
            : "Couldn't start taking notes on this class.",
        ),
      );
    }
  };

  // One join per opening of the classroom — `join` itself guards a second
  // call, which is what makes React's development double-mount harmless.
  useEffect(() => {
    join();
  }, [join]);

  // A browser that cannot record is the one failure in this path the teacher
  // has to hear about while there is still time to act on it — the class
  // would otherwise run to the end and produce nothing, and nobody would
  // know until the notes never arrived. Said once, not on every poll.
  useEffect(() => {
    if (notesRecorder.error) toastError(notesRecorder.error);
  }, [notesRecorder.error]);

  const rosterByUid = useMemo(() => {
    const map = new Map();
    (call.roster || []).forEach((person) => map.set(person.uid, person));
    return map;
  }, [call.roster]);

  const nameFor = (uid) => rosterByUid.get(uid)?.name || `Participant ${uid}`;
  const roleFor = (uid) => rosterByUid.get(uid)?.role;

  const presentUids = useMemo(
    () => [
      ...(call.localUid != null ? [call.localUid] : []),
      ...call.remoteUsers.map((user) => user.uid),
    ],
    [call.localUid, call.remoteUsers],
  );

  // Who gets the big tile. A shared screen wins outright — it is the reason
  // anyone is looking — then the instructor, then whoever is talking.
  const spotlightUid = useMemo(() => {
    if (call.isSharingScreen) return call.localUid;
    const remoteHost = call.remoteUsers.find((user) => roleFor(user.uid) === "HOST");
    if (remoteHost) return remoteHost.uid;
    // Only ever spotlight somebody who actually has a tile: Agora reports a
    // speaker as soon as it hears one, which can be a uid that hasn't
    // published yet (or the local user under a different id), and that would
    // leave the big square empty while hiding them from the strip below.
    if (call.activeSpeakerUid != null && presentUids.includes(call.activeSpeakerUid)) {
      return call.activeSpeakerUid;
    }
    return call.remoteUsers[0]?.uid ?? call.localUid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    call.isSharingScreen,
    call.localUid,
    call.remoteUsers,
    call.activeSpeakerUid,
    presentUids,
    rosterByUid,
  ]);

  const handleLeave = async () => {
    // The board goes down first, on purpose. Leaving the call flips the
    // status, which drops `WhiteboardPanel` from the tree — so the room
    // would otherwise be torn down by an unmount racing the classroom's own
    // teardown, and a Netless room asked for anything after it has begun
    // disconnecting logs the complaint whether or not the caller catches it.
    // Closing it here means it closes while everything is still up.
    setIsWhiteboardOpen(false);

    // `end: true` — unlike the stop button, this really is the end of the
    // class, and that closing upload is what starts the write-up. It has to
    // be on the server before the leave ping, which is the other thing that
    // finishes the notes. A failure to flush must never trap somebody in a
    // call they are trying to leave.
    try {
      await notesRecorder.stopAndFlush({ end: true });
    } catch {
      // The server's own deadline finishes a run whose last upload never
      // landed (`_ensure_local_notes_progress`).
    }
    // `ended: true` — this is somebody actually leaving, not a reload or a
    // remount, and it is what lets the server finish the notes and stop the
    // recording rather than parking them for a rejoin that is not coming.
    await leave({ ended: true });
    onClose?.();
  };

  // A class booked for an hour is over after an hour. The server shuts its
  // door on the stroke of the end, so the room has to close with it rather
  // than leaving everyone in a call they could never rejoin — and for the
  // teacher, this is also what sets the notes going. Warned twice on the way
  // there, because being cut off mid-sentence without notice is worse than
  // the overrun it prevents.
  useClassroomClosing({
    endsAt: session.ends_at,
    enabled: status === CALL_STATUS.CONNECTED,
    onWarn: (message) => toastInfo(message),
    onClose: async () => {
      toastInfo("This class has ended.");
      await handleLeave();
    },
  });

  const renderTile = (uid, { large = false } = {}) => {
    const isLocal = uid === call.localUid;
    const remote = isLocal ? null : call.remoteUsers.find((user) => user.uid === uid);
    if (!isLocal && !remote) return null;

    return (
      <div key={uid} className={large ? "h-full" : ""}>
        <VideoTile
          fill={large}
          track={isLocal ? call.localVideoTrack : remote.videoTrack}
          name={nameFor(uid)}
          label={roleFor(uid) === "HOST" ? "Host" : null}
          isMuted={isLocal ? !call.isMicOn : !remote.hasAudio}
          isLocal={isLocal}
          isScreenShare={isLocal && call.isSharingScreen}
          isSpeaking={uid === call.activeSpeakerUid}
        />
      </div>
    );
  };

  const otherUids = presentUids.filter((uid) => uid !== spotlightUid);

  return (
    <FullScreenPortal>
      <div className="flex flex-col h-full min-h-screen bg-pine text-paper">
        {/* No close control up here: leaving a class is the red button in the
            control bar and nothing else. A dismiss-looking "×" in the corner
            of a live call is the one people hit by reflex, and it ends the
            call for them mid-class. */}
        <header className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-paper/10 shrink-0">
          <div className="min-w-0 flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-clay/20 border border-clay/40 text-rose flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-serif font-bold leading-tight truncate">
                {session.title}
              </h1>
              <p className="text-[11px] text-paper/60 font-light truncate">
                {session.course_code} · {session.course_title} · started{" "}
                {formatClassTime(session.scheduled_at)}
              </p>
            </div>
          </div>

          {/* Everyone in the room is told, in words, for as long as it is
              running. Agora tells nobody that a recorder has joined, and the
              people in this class may be minors — a recording that is not
              announced is one nobody consented to. It sits in the header
              rather than the control bar because it is a fact about the room,
              not a button, and a student has no way to switch it off. */}
          <div className="ml-auto shrink-0 flex items-center gap-2">
            {(isRecording || isRecordingProcessing) && (
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-wider ${
                  isRecording
                    ? "bg-clay/25 border-clay/40 text-rose"
                    : "bg-paper/10 border-paper/20 text-paper/70"
                }`}
              >
                <Circle
                  className={`w-2.5 h-2.5 fill-current ${isRecording ? "animate-pulse" : ""}`}
                />
                <span className="hidden sm:inline">
                  {isRecording ? "This class is being recorded" : "Saving recording"}
                </span>
                <span className="sm:hidden">{isRecording ? "Rec" : "Saving"}</span>
              </span>
            )}

            {/* Said separately from the recording, and in its own words,
                because it is a separate thing being done to the room: a
                class can be written up and not filmed. Both sit here rather
                than in the control bar for the same reason — they are facts
                about the room, not buttons, and a student has no way to
                switch either off. */}
            {(isTakingNotes || isWritingNotes) && (
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-wider ${
                  isTakingNotes
                    ? "bg-gold/20 border-gold/40 text-gold"
                    : "bg-paper/10 border-paper/20 text-paper/70"
                }`}
              >
                <NotebookPen className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {isTakingNotes
                    ? "Notes are being taken"
                    : "Writing up the notes"}
                </span>
                <span className="sm:hidden">Notes</span>
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          <main className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col gap-4">
            {/* IDLE is the single frame between mount and the join effect —
                showing the spinner through it avoids an empty flash. */}
            {(status === CALL_STATUS.CONNECTING || status === CALL_STATUS.IDLE) && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <PingDotSpinner />
                <p className="text-sm text-paper/70 font-light">
                  Opening the classroom…
                </p>
              </div>
            )}

            {status === CALL_STATUS.ERROR && (
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-md w-full bg-paper/5 border border-paper/15 rounded-2xl p-6 text-center">
                  <span className="w-12 h-12 mx-auto mb-4 rounded-xl bg-clay/20 border border-clay/40 text-rose flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </span>
                  <h2 className="text-lg font-serif font-bold mb-2">
                    Couldn&apos;t open the classroom
                  </h2>
                  <p className="text-sm text-paper/70 font-light leading-relaxed mb-6">
                    {call.error}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        call.clearError();
                        join();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gold text-ink font-bold font-mono text-xs uppercase tracking-wider cursor-pointer hover:bg-gold/85 transition-colors"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={handleLeave}
                      className="px-5 py-2.5 rounded-xl border border-paper/20 text-paper/80 font-mono text-xs uppercase tracking-wider cursor-pointer hover:bg-paper/10 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {status === CALL_STATUS.CONNECTED && isWhiteboardOpen && (
              <>
                {/* Keyed on the class so switching classes never hands a
                    board's connection to a different room. */}
                <WhiteboardPanel
                  key={session.id}
                  sessionId={session.id}
                  onClose={() => setIsWhiteboardOpen(false)}
                />

                {/* Smaller squares than the spotlight layout uses, and more
                    of them: while the board is up the faces are context, and
                    every row of pixels they take is a row the thing being
                    explained does not get. */}
                {presentUids.length > 0 && (
                  <div className="shrink-0 grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-2">
                    {presentUids.slice(0, 8).map((uid) => renderTile(uid))}
                  </div>
                )}
              </>
            )}

            {status === CALL_STATUS.CONNECTED && !isWhiteboardOpen && (
              <>
                <div className="flex-1 min-h-0">
                  {spotlightUid != null && renderTile(spotlightUid, { large: true })}
                </div>

                {otherUids.length > 0 && (
                  <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {otherUids.slice(0, 8).map((uid) => renderTile(uid))}
                  </div>
                )}

                {call.remoteUsers.length === 0 && (
                  <p className="shrink-0 text-center text-sm text-paper/60 font-light">
                    You&apos;re the first one here. The room stays open for everyone
                    else to join.
                  </p>
                )}
              </>
            )}
          </main>

          {isParticipantsOpen && (
            <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-paper/10 max-h-72 lg:max-h-none">
              <ClassroomParticipantsPanel
                roster={call.roster}
                presentUids={presentUids}
                localUid={call.localUid}
                activeSpeakerUid={call.activeSpeakerUid}
              />
            </aside>
          )}
        </div>

        <footer className="shrink-0 px-4 sm:px-6 py-4 border-t border-paper/10">
          <ClassroomControls
            isMicOn={call.isMicOn}
            isCameraOn={call.isCameraOn}
            isSharingScreen={call.isSharingScreen}
            hasMic={call.hasMic}
            hasCamera={call.hasCamera}
            isHost={Boolean(session.is_host)}
            isConnected={status === CALL_STATUS.CONNECTED}
            participantCount={presentUids.length}
            isParticipantsOpen={isParticipantsOpen}
            isWhiteboardOpen={isWhiteboardOpen}
            isWhiteboardAvailable={Boolean(session.whiteboard_available)}
            isRecording={isRecording}
            isRecordingProcessing={isRecordingProcessing}
            isRecordingAvailable={Boolean(
              recording.data?.configured ?? session.recording_configured,
            )}
            isRecordingBusy={recordingControls.isBusy}
            isTakingNotes={isTakingNotes}
            isNotesPaused={Boolean(notes.data?.is_paused)}
            isWritingNotes={isWritingNotes}
            isNotesAvailable={Boolean(
              notes.data?.configured ?? session.notes_configured,
            )}
            isNotesBusy={notesControls.isBusy}
            onToggleRecording={handleToggleRecording}
            onToggleNotes={handleToggleNotes}
            onToggleMic={call.toggleMic}
            onToggleCamera={call.toggleCamera}
            onToggleScreenShare={call.toggleScreenShare}
            onToggleWhiteboard={() => setIsWhiteboardOpen((open) => !open)}
            onToggleParticipants={() => setIsParticipantsOpen((open) => !open)}
            onLeave={handleLeave}
          />
        </footer>
      </div>
    </FullScreenPortal>
  );
}
