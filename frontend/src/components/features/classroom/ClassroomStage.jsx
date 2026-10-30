"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Radio } from "lucide-react";
import FullScreenPortal from "@/components/features/portal/lesson-view/FullScreenPortal";
import PingDotSpinner from "@/components/ui/PingDotSpinner";
import { useAgoraCall, CALL_STATUS } from "@/hooks/useAgoraCall";
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

  // One join per opening of the classroom — `join` itself guards a second
  // call, which is what makes React's development double-mount harmless.
  useEffect(() => {
    join();
  }, [join]);

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
    await leave();
    onClose?.();
  };

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
