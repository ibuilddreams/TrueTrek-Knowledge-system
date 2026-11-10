"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Hand, Headphones, NotebookPen, Radio } from "lucide-react";
import FullScreenPortal from "@/components/features/portal/lesson-view/FullScreenPortal";
import PingDotSpinner from "@/components/ui/PingDotSpinner";
import { useAgoraCall, CALL_STATUS } from "@/hooks/useAgoraCall";
import { useClassroomClosing } from "@/hooks/useClassroomClosing";
import { useRoomAudioRecorder } from "@/hooks/useRoomAudioRecorder";
import { useLiveSession } from "@/hooks/student/useLiveSessions";
import {
  useLiveSessionNotes,
  useLiveSessionNotesControls,
} from "@/hooks/student/useLiveSessionNotes";
import {
  joinSessionRoom,
  leaveSessionRoom,
  setSessionAudienceAccess,
  uploadSessionNotesAudio,
} from "@/services/liveSessionsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { formatSessionTime } from "@/components/features/portal/live/sessionUtils";
import LiveRoomControls from "./LiveRoomControls";
import LiveRoomParticipantsPanel from "./LiveRoomParticipantsPanel";
import SpeakerTile from "./SpeakerTile";

/**
 * The War Room Live room — one full-screen Agora call for one session, used
 * unchanged by the admin portal and the student portal (the convention
 * `ClassroomStage` already set for live classes).
 *
 * It is deliberately a portal to <body> rather than a tab panel: a call that
 * unmounts when a tab changes is a call that drops, and a `position: fixed`
 * overlay inside the portals' animated containers would be trapped in them.
 *
 * **Audio, not video.** A War Room Live session is a guest athlete talking to
 * a roomful of students, so there is no camera, no screen to share and no
 * whiteboard — the stage is a wall of voices, with whoever is speaking lit.
 *
 * **The floor is the one thing a room has that a classroom does not.** By
 * default the hosts and their guests speak and everybody else listens, and
 * that is carried in the Agora token rather than in this component: a
 * listener's client genuinely cannot publish until the server mints it a new
 * one. Opening the floor therefore means every listener asking for a fresh
 * token, which is what the poll below is for — the session is re-asked while
 * somebody is in the room, and `refreshCredentials` is called the moment the
 * answer changes.
 */
export default function LiveRoomStage({ session, onClose }) {
  const queryClient = useQueryClient();
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // What the room is like right now, as opposed to what the card that opened
  // it said. Polled only while somebody is actually in it.
  const live = useLiveSession(session.id, { poll: true });
  const current = live.data || session;
  const isHost = Boolean(current.is_host);
  const isFloorOpen = Boolean(current.audience_can_speak);

  const call = useAgoraCall(session.id, {
    joinRequest: joinSessionRoom,
    leaveRequest: leaveSessionRoom,
    // Audio only: nobody is asked for a camera they are not going to use.
    withVideo: false,
    // Everybody but the host arrives muted — and their microphone is not even
    // acquired until they ask for it. Thirty people dropping into a guest's
    // session already talking is the opposite of what this room is.
    startMuted: !isHost,
  });
  const { join, leave, status, refreshCredentials } = call;

  const notes = useLiveSessionNotes(session.id, {
    poll: status === CALL_STATUS.CONNECTED,
  });
  const notesControls = useLiveSessionNotesControls(session.id);
  const isTakingNotes = notes.data
    ? Boolean(notes.data.is_transcribing)
    : call.wasTakingNotesAtJoin;
  const isWritingNotes = Boolean(notes.data?.is_writing);

  // The recorder *is this browser* — but only for the one person the run
  // nominated. Everybody else in the room watches the same "notes are being
  // taken" badge and records nothing, which is what stops a second admin's
  // room posting a second copy of the hour.
  //
  // The join payload answers this too, and answers it first: the notes query
  // is a second request racing the same page load, and the seconds between
  // them are the first thing the guest says. Whichever has arrived wins, with
  // the polled answer taking over once it has.
  const notesCapture = notes.data?.capture || call.notesCaptureAtJoin || null;
  const isNotesCapturer =
    notesCapture?.mode === "local" &&
    call.localUid != null &&
    notesCapture.capturer_id === call.localUid;

  const notesRecorder = useRoomAudioRecorder({
    sessionId: session.id,
    uploadSegment: uploadSessionNotesAudio,
    active: isNotesCapturer && isTakingNotes && status === CALL_STATUS.CONNECTED,
    runId: notesCapture?.run_id ?? null,
    segmentSeconds: notesCapture?.segment_seconds,
    audioBitrate: notesCapture?.audio_bitrate,
    mimeTypes: notesCapture?.mime_types,
    localAudioTrack: call.localAudioTrack,
    // The uid the recorder files the host's own turns under — the same number
    // the roster names them by, which is what lets the transcript say
    // "Maya:" instead of "Speaker:".
    localUid: call.localUid,
    isMicOn: call.isMicOn,
    remoteUsers: call.remoteUsers,
  });

  // One join per opening of the room — `join` itself guards a second call,
  // which is what makes React's development double-mount harmless.
  useEffect(() => {
    join();
  }, [join]);

  // The floor moved while this person was in the room. Their token is what
  // decides whether they may speak, so the only thing to do about it is ask
  // the server for a new one; a host's token already publishes and never
  // needs replacing for this.
  useEffect(() => {
    if (status !== CALL_STATUS.CONNECTED || isHost) return;
    if (isFloorOpen === call.canSpeak) return;
    refreshCredentials();
  }, [status, isHost, isFloorOpen, call.canSpeak, refreshCredentials]);

  // A browser that cannot record is the one failure in this path the host has
  // to hear about while there is still time to act on it — the session would
  // otherwise run to the end and produce nothing, and nobody would know until
  // the notes never arrived. Said once, not on every poll.
  useEffect(() => {
    if (notesRecorder.error) toastError(notesRecorder.error);
  }, [notesRecorder.error]);

  const floorMutation = useMutation({
    mutationFn: (access) => setSessionAudienceAccess(session.id, access),
  });

  const handleToggleFloor = async () => {
    const next = isFloorOpen ? "LISTEN_ONLY" : "EVERYONE";
    try {
      const response = await floorMutation.mutateAsync(next);
      toastSuccess(
        response?.message ||
          (next === "EVERYONE" ? "The floor is open." : "The floor is closed."),
      );
      // Everything that renders this session carries the floor with it.
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-live-sessions"] });
    } catch (error) {
      toastError(getApiErrorMessage(error, "Couldn't change who can speak."));
    }
  };

  const handleToggleNotes = async () => {
    // Stopping mid-session is a **pause**: the last piece of audio goes up
    // without `end`, so it joins everything else on this run and the next
    // stretch appends to it. One session taken in two sittings comes out as
    // one set of notes. Awaited, not fired off — the segment has to be on the
    // server before the server is told to park the run.
    if (isTakingNotes) {
      await notesRecorder.stopAndFlush();
    }
    const mutation = isTakingNotes ? notesControls.stop : notesControls.start;
    try {
      const response = await mutation.mutateAsync();
      toastSuccess(
        response?.message || (isTakingNotes ? "Notes paused." : "Taking notes."),
      );
    } catch (error) {
      toastError(
        getApiErrorMessage(
          error,
          isTakingNotes
            ? "Couldn't pause the notes."
            : "Couldn't start taking notes on this session.",
        ),
      );
    }
  };

  const handleLeave = useCallback(async () => {
    // `end: true` — unlike the stop button, this really is the end of the
    // session, and that closing upload is what starts the write-up. It has to
    // be on the server before the leave ping, which is the other thing that
    // finishes the notes. A failure to flush must never trap somebody in a
    // room they are trying to leave.
    try {
      await notesRecorder.stopAndFlush({ end: true });
    } catch {
      // The server's own deadline finishes a run whose last upload never
      // landed (`live_sessions/notes.py::_ensure_notes_progress`).
    }
    // `ended: true` — this is somebody actually leaving, not a reload or a
    // remount, and it is what lets the server finish the notes rather than
    // parking them for a rejoin that is not coming.
    await leave({ ended: true });
    onClose?.();
  }, [leave, notesRecorder, onClose]);

  // A session booked for an hour is over after an hour plus the overrun these
  // always run into. The server shuts its door at that moment, so the room
  // has to close with it rather than leaving everyone in a call they could
  // never rejoin — and for the host, this is also what sets the notes going.
  // Warned twice on the way there, because being cut off mid-sentence without
  // notice is worse than the overrun it prevents.
  useClassroomClosing({
    endsAt: current.room_closes_at || current.ends_at,
    enabled: status === CALL_STATUS.CONNECTED,
    subject: "session",
    onWarn: (message) => toastInfo(message),
    onClose: async () => {
      toastInfo("This session has ended.");
      await handleLeave();
    },
  });

  const rosterByUid = useMemo(() => {
    const map = new Map();
    (call.roster || []).forEach((person) => map.set(person.uid, person));
    return map;
  }, [call.roster]);

  const nameFor = (uid) => rosterByUid.get(uid)?.name || `Guest ${uid}`;
  const isHostUid = (uid) => rosterByUid.get(uid)?.role === "HOST";

  const presentUids = useMemo(
    () => [
      ...(call.localUid != null ? [call.localUid] : []),
      ...call.remoteUsers.map((user) => user.uid),
    ],
    [call.localUid, call.remoteUsers],
  );

  // Whoever is running the room and whoever they brought on, up top; everyone
  // listening underneath. In an audio session that is the whole of the
  // layout — there is no screen to spotlight, and the question a listener is
  // asking is "who is talking".
  const onTheMic = presentUids.filter((uid) => isHostUid(uid));
  const listening = presentUids.filter((uid) => !isHostUid(uid));

  const renderTile = (uid, { large = false } = {}) => {
    const isLocal = uid === call.localUid;
    const remote = isLocal ? null : call.remoteUsers.find((user) => user.uid === uid);
    if (!isLocal && !remote) return null;

    return (
      <SpeakerTile
        key={uid}
        name={nameFor(uid)}
        isHost={isHostUid(uid)}
        isLocal={isLocal}
        isMuted={isLocal ? !call.isMicOn : !remote.hasAudio}
        isSpeaking={uid === call.activeSpeakerUid}
        large={large}
      />
    );
  };

  return (
    <FullScreenPortal>
      <div className="flex flex-col h-full min-h-screen bg-pine text-paper">
        {/* No close control up here: leaving a room is the red button in the
            control bar and nothing else. A dismiss-looking "×" in the corner
            of a live call is the one people hit by reflex. */}
        <header className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-paper/10 shrink-0">
          <div className="min-w-0 flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-clay/20 border border-clay/40 text-rose flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-serif font-bold leading-tight truncate">
                {current.title}
              </h1>
              <p className="text-[11px] text-paper/60 font-light truncate">
                War Room Live
                {current.topic ? ` · ${current.topic}` : ""} · started{" "}
                {formatSessionTime(current.scheduled_at)}
              </p>
            </div>
          </div>

          <div className="ml-auto shrink-0 flex items-center gap-2">
            {isFloorOpen && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-paper/10 border-paper/20 text-paper/80 text-[11px] font-mono uppercase tracking-wider">
                <Hand className="w-3 h-3" />
                <span className="hidden sm:inline">The floor is open</span>
                <span className="sm:hidden">Floor open</span>
              </span>
            )}

            {/* Everyone in the room is told, in words, for as long as it is
                running. The people in this session may be minors, and a
                recording nobody announced is one nobody consented to. It sits
                in the header rather than the control bar because it is a fact
                about the room, not a button — a listener has no way to switch
                it off. */}
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
          <main className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 sm:p-6 flex flex-col gap-6">
            {/* IDLE is the single frame between mount and the join effect —
                showing the spinner through it avoids an empty flash. */}
            {(status === CALL_STATUS.CONNECTING || status === CALL_STATUS.IDLE) && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <PingDotSpinner />
                <p className="text-sm text-paper/70 font-light">
                  Opening the room…
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
                    Couldn&apos;t open the room
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

            {status === CALL_STATUS.CONNECTED && (
              <>
                <section className="space-y-3">
                  <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                    On the mic
                  </h2>
                  {onTheMic.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {onTheMic.map((uid) => renderTile(uid, { large: true }))}
                    </div>
                  ) : (
                    <p className="text-sm text-paper/60 font-light">
                      Nobody is hosting yet. The room stays open — hang on a
                      moment.
                    </p>
                  )}
                </section>

                <section className="space-y-3">
                  <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-paper/50">
                    Listening ({listening.length})
                  </h2>
                  {listening.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
                      {listening.map((uid) => renderTile(uid))}
                    </div>
                  ) : (
                    <p className="text-sm text-paper/60 font-light">
                      Nobody else is here yet.
                    </p>
                  )}
                </section>

                {!call.canSpeak && (
                  <p className="mt-auto text-center text-xs text-paper/50 font-light inline-flex items-center justify-center gap-2">
                    <Headphones className="w-3.5 h-3.5" />
                    You&apos;re listening in. The host can open the floor if
                    they want questions out loud.
                  </p>
                )}
              </>
            )}
          </main>

          {isParticipantsOpen && (
            <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-paper/10 max-h-72 lg:max-h-none">
              <LiveRoomParticipantsPanel
                roster={call.roster}
                presentUids={presentUids}
                localUid={call.localUid}
                activeSpeakerUid={call.activeSpeakerUid}
              />
            </aside>
          )}
        </div>

        <footer className="shrink-0 px-4 sm:px-6 py-4 border-t border-paper/10">
          <LiveRoomControls
            isMicOn={call.isMicOn}
            canSpeak={call.canSpeak}
            isConnected={status === CALL_STATUS.CONNECTED}
            isHost={isHost}
            isFloorOpen={isFloorOpen}
            isFloorBusy={floorMutation.isPending}
            participantCount={presentUids.length}
            isParticipantsOpen={isParticipantsOpen}
            isTakingNotes={isTakingNotes}
            isNotesPaused={Boolean(notes.data?.is_paused)}
            isWritingNotes={isWritingNotes}
            isNotesAvailable={Boolean(
              notes.data?.configured ?? current.notes_configured,
            )}
            isNotesBusy={notesControls.isBusy}
            onToggleMic={call.toggleMic}
            onToggleFloor={handleToggleFloor}
            onToggleNotes={handleToggleNotes}
            onToggleParticipants={() => setIsParticipantsOpen((open) => !open)}
            onLeave={handleLeave}
          />
        </footer>
      </div>
    </FullScreenPortal>
  );
}
