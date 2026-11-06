"use client";

import {
  Circle,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  NotebookPen,
  PenTool,
  PhoneOff,
  Square,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import ClassroomControlButton from "./ClassroomControlButton";

/**
 * The bar along the bottom of the classroom.
 *
 * Screen sharing is offered to the host only: a class where any student can
 * take the wall is a class the teacher has to police. The backend hands
 * everyone a publisher token precisely so this stays a product choice that
 * can be relaxed later, rather than something baked into the credential.
 *
 * The whiteboard is offered to *everyone*, which is the opposite choice and
 * deliberate: it is one shared board rather than a wall somebody takes, and a
 * student who opens it sees what the teacher has already drawn. Who may draw
 * on it is a separate question, answered by the server in the room token
 * (class_sessions/services.py::whiteboard_role), not by hiding this button.
 *
 * Recording is the host's alone, and the server enforces that — a student
 * cannot start a recorder in someone's class and cannot switch one off
 * either. It is a live control rather than a report of what was decided at
 * scheduling time: a class the teacher ticked "record" for starts recording
 * by itself the moment they open the room, and a class they did not is one
 * they can still start recording from here. Pressing it writes that decision
 * back onto the class, so a recording switched off mid-class does not come
 * back by itself the next time the classroom renews its pass. The only thing
 * that greys it out is a server with no recording credentials at all. That a
 * class is being recorded is announced in the header to everybody, not here,
 * because it is a fact about the room rather than a control.
 *
 * Meeting notes get a button of their own beside it, under the same rules and
 * for the same reasons, because they are a genuinely separate thing: a
 * different feature on a different per-class switch, so a teacher can be
 * recording and not taking notes, or taking notes and not recording, and the
 * control bar has to be able to say so. Merging the two into one "capture"
 * button would make the commonest case — notes on, camera off the record —
 * impossible to express.
 *
 * The notes button is a **pause**, and the title says so. Pressing it does
 * not end the write-up: the class is still going, what has been said is kept,
 * and pressing it again carries on into the same notes. Nothing here spins
 * while that is true — a teacher who paused for an exercise should find the
 * button ready, not greyed out behind a write-up of the first ten minutes.
 */
export default function ClassroomControls({
  isMicOn,
  isCameraOn,
  isSharingScreen,
  hasMic,
  hasCamera,
  isHost,
  isConnected,
  participantCount,
  isParticipantsOpen,
  isWhiteboardOpen,
  isWhiteboardAvailable,
  isRecording,
  isRecordingProcessing,
  isRecordingAvailable,
  isRecordingBusy,
  isTakingNotes,
  isNotesPaused,
  isWritingNotes,
  isNotesAvailable,
  isNotesBusy,
  onToggleRecording,
  onToggleNotes,
  onToggleParticipants,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleWhiteboard,
  onLeave,
}) {
  const recordingTitle = !isRecordingAvailable
    ? "Recording isn't set up on this server (AGORA_RECORDING_* in backend/.env)"
    : !isConnected
      ? "Connecting to the classroom…"
      : isRecordingProcessing
        ? "Saving the recording — your students are notified when it's ready"
        : isRecording
          ? "Stop recording this class"
          : "Record this class";

  const notesTitle = !isNotesAvailable
    ? "Class notes aren't set up on this server (GEMINI_API_KEY in backend/.env)"
    : !isConnected
      ? "Connecting to the classroom…"
      : isWritingNotes
        ? "Writing the notes up — your students are notified when they're ready"
        : isTakingNotes
          ? "Pause the notes — the class carries on and the write-up waits for the end"
          : isNotesPaused
            ? "Carry on taking notes — this picks up the same notes, it doesn't start a second set"
            : "Take notes on this class";

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <ClassroomControlButton
        onClick={onToggleMic}
        active={isMicOn}
        disabled={!hasMic}
        title={
          !hasMic
            ? "No microphone available"
            : isMicOn
              ? "Mute microphone"
              : "Unmute microphone"
        }
      >
        {isMicOn && hasMic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </ClassroomControlButton>

      <ClassroomControlButton
        onClick={onToggleCamera}
        active={isCameraOn}
        disabled={!hasCamera}
        title={
          !hasCamera
            ? "No camera available"
            : isCameraOn
              ? "Turn camera off"
              : "Turn camera on"
        }
      >
        {isCameraOn && hasCamera ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
      </ClassroomControlButton>

      {isHost && (
        <ClassroomControlButton
          onClick={onToggleScreenShare}
          active={!isSharingScreen}
          // Sharing publishes a track, which a client that hasn't finished
          // joining will refuse — so the button waits for the connection
          // rather than offering an action that cannot work yet.
          disabled={!isConnected}
          title={
            !isConnected
              ? "Connecting to the classroom…"
              : isSharingScreen
                ? "Stop sharing your screen"
                : "Share your screen"
          }
        >
          <MonitorUp className="w-5 h-5" />
        </ClassroomControlButton>
      )}

      {/* Shown even on a server with no whiteboard credentials, and disabled
          with the reason instead of hidden. Hiding it was the first instinct
          — a greyed-out button invites a teacher to keep pressing it — but it
          makes a missing credential indistinguishable from a feature that was
          never built, which is a day lost to the wrong question. The video
          path already answers this the same way: the join button is always
          there and says 503 if the server has no Agora keys. */}
      <ClassroomControlButton
        onClick={onToggleWhiteboard}
        active={!isWhiteboardOpen}
        disabled={!isConnected || !isWhiteboardAvailable}
        title={
          !isWhiteboardAvailable
            ? "The whiteboard isn't set up on this server (AGORA_WHITEBOARD_* in backend/.env)"
            : !isConnected
              ? "Connecting to the classroom…"
              : isWhiteboardOpen
                ? "Close the whiteboard"
                : "Open the whiteboard"
        }
      >
        <PenTool className="w-5 h-5" />
      </ClassroomControlButton>

      {/* Shown to the host on every server, and disabled with the reason
          rather than hidden — the same choice the whiteboard button makes,
          for the same reason: a missing credential and a feature that was
          never built look identical once a button disappears. */}
      {isHost && (
        <ClassroomControlButton
          onClick={onToggleRecording}
          active={!isRecording}
          danger={isRecording}
          disabled={
            !isConnected ||
            !isRecordingAvailable ||
            isRecordingBusy ||
            isRecordingProcessing
          }
          title={recordingTitle}
        >
          {isRecordingBusy || isRecordingProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </ClassroomControlButton>
      )}

      {/* Shown to the host on every server and disabled with the reason
          rather than hidden, exactly like the record button beside it. It is
          a separate button because it is a separate feature: the server will
          happily transcribe a class it is not recording. */}
      {isHost && (
        <ClassroomControlButton
          onClick={onToggleNotes}
          active={!isTakingNotes}
          danger={isTakingNotes}
          disabled={
            !isConnected || !isNotesAvailable || isNotesBusy || isWritingNotes
          }
          title={notesTitle}
        >
          {isNotesBusy || isWritingNotes ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <NotebookPen className="w-5 h-5" />
          )}
        </ClassroomControlButton>
      )}

      <ClassroomControlButton
        onClick={onToggleParticipants}
        active={!isParticipantsOpen}
        title={isParticipantsOpen ? "Hide participants" : "Show participants"}
      >
        <span className="relative">
          <Users className="w-5 h-5" />
          {participantCount > 0 && (
            <span className="absolute -top-2 -right-2.5 min-w-[1.1rem] px-1 rounded-full bg-gold text-ink text-[10px] font-mono leading-4 text-center">
              {participantCount}
            </span>
          )}
        </span>
      </ClassroomControlButton>

      <ClassroomControlButton onClick={onLeave} danger title="Leave the classroom">
        <PhoneOff className="w-5 h-5" />
      </ClassroomControlButton>
    </div>
  );
}
