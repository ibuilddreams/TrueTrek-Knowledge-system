"use client";

import { formatSeconds } from "./wargamerConstants";

/**
 * One line of the scene.
 *
 * The counterpart sits left and the athlete right, the arrangement every chat
 * surface in the portal uses. `boundaryTurn` highlights the athlete message
 * the grader identified as their first clear refusal, so the report card's
 * Time-to-Boundary score points at something the student can actually see.
 */
export default function RolePlayMessage({
  turn,
  counterpartRole,
  athleteTurnNumber = null,
  isBoundaryTurn = false,
}) {
  const isAthlete = turn.speaker === "ATHLETE";
  const elapsed = formatSeconds(turn.seconds_from_start);

  return (
    <div className={`flex ${isAthlete ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isAthlete ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            {isAthlete ? "You" : counterpartRole}
          </span>
          {isAthlete && elapsed && (
            <span className="text-[10px] font-mono text-muted tabular-nums">{elapsed}</span>
          )}
          {isBoundaryTurn && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-pine">
              Boundary set
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm font-light leading-relaxed whitespace-pre-wrap break-words ${
            isAthlete
              ? "bg-pine text-paper rounded-br-md"
              : "bg-porcelain border border-line text-ink rounded-bl-md"
          } ${isBoundaryTurn ? "ring-2 ring-gold/50" : ""}`}
        >
          {turn.content}
        </div>

        {isAthlete && athleteTurnNumber !== null && (
          <span className="text-[10px] font-mono text-muted px-1 tabular-nums">
            Reply {athleteTurnNumber}
          </span>
        )}
      </div>
    </div>
  );
}
