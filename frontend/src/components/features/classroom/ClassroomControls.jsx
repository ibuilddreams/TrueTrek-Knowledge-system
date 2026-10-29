"use client";

import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
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
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleParticipants,
  onLeave,
}) {
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
