"use client";

import {
  Hand,
  Loader2,
  Mic,
  MicOff,
  NotebookPen,
  PhoneOff,
  Square,
  Users,
} from "lucide-react";
import ClassroomControlButton from "@/components/features/classroom/ClassroomControlButton";

/**
 * The bar along the bottom of a War Room Live room.
 *
 * Shorter than the classroom's, because a War Room Live session is audio:
 * there is no camera, no screen to share and no whiteboard. What it does have
 * that a classroom does not is a **floor**.
 *
 * Opening the floor is the host's alone, and it is not a hint to the browser:
 * it changes the role inside every token the room mints
 * (live_sessions/services.py::issue_join_credentials), so a listener's client
 * genuinely cannot publish until it has asked for a new one. Hiding this
 * button from a student would be decoration; the server is what refuses.
 *
 * The microphone button stays on screen for a listener rather than vanishing,
 * disabled and saying why — a room where the control disappears is one where
 * somebody wonders whether their browser is broken.
 *
 * Meeting notes work exactly as they do in a classroom, and the button is a
 * **pause**: pressing it does not end the write-up. The session is still
 * going, what has been said is kept, and pressing it again carries on into
 * the same notes. Nothing here spins while that is true.
 */
export default function LiveRoomControls({
  isMicOn,
  canSpeak,
  isConnected,
  isHost,
  isFloorOpen,
  isFloorBusy,
  participantCount,
  isParticipantsOpen,
  isTakingNotes,
  isNotesPaused,
  isWritingNotes,
  isNotesAvailable,
  isNotesBusy,
  onToggleMic,
  onToggleFloor,
  onToggleNotes,
  onToggleParticipants,
  onLeave,
}) {
  const micTitle = !isConnected
    ? "Connecting to the room…"
    : !canSpeak
      ? "Only the hosts and their guests can speak in this session"
      : isMicOn
        ? "Mute"
        : "Unmute";

  const notesTitle = !isNotesAvailable
    ? "Session notes aren't set up on this server (GEMINI_API_KEY in backend/.env)"
    : !isConnected
      ? "Connecting to the room…"
      : isWritingNotes
        ? "Writing the notes up — everybody who was here is told when they're ready"
        : isTakingNotes
          ? "Pause the notes — the session carries on and the write-up waits for the end"
          : isNotesPaused
            ? "Carry on taking notes — this picks up the same notes, it doesn't start a second set"
            : "Take notes on this session";

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <ClassroomControlButton
        onClick={onToggleMic}
        active={isMicOn}
        disabled={!isConnected || !canSpeak}
        title={micTitle}
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </ClassroomControlButton>

      {isHost && (
        <ClassroomControlButton
          onClick={onToggleFloor}
          active={isFloorOpen}
          disabled={!isConnected || isFloorBusy}
          title={
            isFloorOpen
              ? "Close the floor — only you and your guests can speak"
              : "Open the floor — everyone in the room can unmute"
          }
        >
          {isFloorBusy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Hand className="w-5 h-5" />
          )}
        </ClassroomControlButton>
      )}

      {isHost && (
        <ClassroomControlButton
          onClick={onToggleNotes}
          active={isTakingNotes}
          disabled={!isNotesAvailable || !isConnected || isNotesBusy || isWritingNotes}
          title={notesTitle}
        >
          {isNotesBusy || isWritingNotes ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isTakingNotes ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <NotebookPen className="w-5 h-5" />
          )}
        </ClassroomControlButton>
      )}

      <ClassroomControlButton
        onClick={onToggleParticipants}
        active={isParticipantsOpen}
        title={isParticipantsOpen ? "Hide who's here" : "Show who's here"}
      >
        <span className="relative">
          <Users className="w-5 h-5" />
          {participantCount > 0 && (
            <span className="absolute -top-2 -right-2.5 min-w-[1.1rem] px-1 h-[1.1rem] rounded-full bg-gold text-ink text-[10px] font-mono font-bold flex items-center justify-center">
              {participantCount}
            </span>
          )}
        </span>
      </ClassroomControlButton>

      <span className="w-px h-8 bg-paper/15 mx-1 hidden sm:block" />

      <ClassroomControlButton onClick={onLeave} danger title="Leave the room">
        <PhoneOff className="w-5 h-5" />
      </ClassroomControlButton>
    </div>
  );
}
