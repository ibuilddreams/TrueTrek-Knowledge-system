"use client";

import { useEffect, useRef } from "react";
import { MicOff, MonitorUp } from "lucide-react";
import { getInitials } from "./classSessionUtils";

/**
 * One participant's square on the wall.
 *
 * An Agora track isn't a React value — it renders itself into a DOM node —
 * so the only job here is to hand it a container and take it back when the
 * track changes or the tile unmounts. Without that `stop()`, a student who
 * switches their camera off leaves a frozen frame behind.
 */
export default function VideoTile({
  track,
  name,
  label,
  isMuted = false,
  isLocal = false,
  isScreenShare = false,
  isSpeaking = false,
  // The spotlight takes whatever height the stage gives it; a tile in the
  // strip keeps a 16:9 box so the row stays even.
  fill = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!track || !container) return undefined;

    // The local camera is mirrored, the way every video app shows you to
    // yourself; a shared screen never is, or text reads backwards.
    track.play(container, { fit: isScreenShare ? "contain" : "cover" });
    return () => {
      try {
        track.stop();
      } catch {
        // The track was already closed by the call teardown.
      }
    };
  }, [track, isScreenShare]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-ink border transition-colors ${
        isSpeaking ? "border-gold ring-2 ring-gold/40" : "border-ink/60"
      } ${fill ? "h-full" : ""}`}
    >
      <div
        ref={containerRef}
        className={`w-full h-full ${fill ? "min-h-[12rem]" : "min-h-[8rem] aspect-video"} ${
          isLocal && !isScreenShare ? "[&_video]:scale-x-[-1]" : ""
        }`}
      />

      {!track && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-pine/90">
          <div className="w-14 h-14 rounded-2xl bg-paper/10 border border-paper/20 text-paper flex items-center justify-center font-mono text-lg">
            {getInitials(name)}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-t from-ink/85 to-transparent">
        <span className="text-xs font-medium text-paper truncate">
          {name}
          {isLocal && " (You)"}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {isScreenShare && <MonitorUp className="w-3.5 h-3.5 text-gold" />}
          {isMuted && <MicOff className="w-3.5 h-3.5 text-clay" />}
          {label && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-gold/20 text-gold border border-gold/30">
              {label}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
