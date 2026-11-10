"use client";

import { Mic, MicOff } from "lucide-react";
import { getInitials } from "@/components/features/classroom/classSessionUtils";

/**
 * One voice in a War Room Live room.
 *
 * Deliberately not `VideoTile`. A War Room Live session is audio: there is no
 * picture to show, so a 16:9 black rectangle per person would be a wall of
 * nothing with names underneath it. What a listener actually needs to know is
 * who is in the room and which of them is talking — so this is a circle, a
 * name, and a ring that lights when they speak.
 *
 * `isHost` marks the people running the room and the guests on the call.
 * Everybody else is a listener, and whether a listener may speak at all is
 * the server's decision, carried in their token.
 */
export default function SpeakerTile({
  name,
  isHost = false,
  isLocal = false,
  isMuted = false,
  isSpeaking = false,
  large = false,
}) {
  const size = large ? "w-24 h-24 text-2xl" : "w-14 h-14 text-sm";

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-colors ${
        isSpeaking
          ? "bg-gold/10 border-gold/50"
          : "bg-paper/5 border-paper/10"
      }`}
    >
      <span
        className={`relative rounded-full flex items-center justify-center font-mono border transition-all ${size} ${
          isHost
            ? "bg-gold/15 border-gold/40 text-gold"
            : "bg-paper/10 border-paper/20 text-paper"
        } ${isSpeaking ? "ring-4 ring-gold/40" : ""}`}
      >
        {getInitials(name)}
        <span
          className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border flex items-center justify-center ${
            isMuted
              ? "bg-pine border-paper/20 text-paper/50"
              : "bg-gold border-gold text-ink"
          }`}
        >
          {isMuted ? (
            <MicOff className="w-3 h-3" />
          ) : (
            <Mic className="w-3 h-3" />
          )}
        </span>
      </span>

      <span className="min-w-0 text-center">
        <span className="block text-xs font-medium text-paper truncate max-w-[9rem]">
          {name}
          {isLocal && " (You)"}
        </span>
        {isHost && (
          <span className="block text-[9px] font-mono uppercase tracking-widest text-gold mt-0.5">
            Host
          </span>
        )}
      </span>
    </div>
  );
}
