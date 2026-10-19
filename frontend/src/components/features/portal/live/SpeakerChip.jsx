"use client";

import { UserRound } from "lucide-react";

export default function SpeakerChip({ speaker, size = "base" }) {
  const isLarge = size === "lg";
  const initials =
    speaker.name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "";

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {speaker.avatar_url ? (
        // Remote media host isn't in next.config's image domains, so a plain
        // <img> is used here as elsewhere in the portal for user uploads.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={speaker.avatar_url}
          alt={speaker.name}
          className={`${isLarge ? "w-10 h-10" : "w-8 h-8"} rounded-full object-cover border border-line shrink-0`}
        />
      ) : (
        <div
          className={`${isLarge ? "w-10 h-10 text-xs" : "w-8 h-8 text-[10px]"} rounded-full bg-pine/10 border border-pine/20 text-pine font-mono font-bold flex items-center justify-center shrink-0`}
        >
          {initials || <UserRound className="w-3.5 h-3.5" />}
        </div>
      )}

      <div className="min-w-0">
        <p className={`${isLarge ? "text-sm" : "text-xs"} font-semibold text-ink truncate`}>
          {speaker.name}
        </p>
        {speaker.headline && (
          <p className="text-[11px] text-muted font-light truncate">{speaker.headline}</p>
        )}
      </div>
    </div>
  );
}
