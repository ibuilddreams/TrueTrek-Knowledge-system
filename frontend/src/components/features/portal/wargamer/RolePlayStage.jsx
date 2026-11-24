"use client";

import { useEffect, useRef } from "react";
import { ClipboardCheck, DoorClosed, Flag, Target } from "lucide-react";
import { getPersonaMeta, getPressureMeta } from "./wargamerConstants";
import RolePlayMessage from "./RolePlayMessage";
import RolePlayTypingIndicator from "./RolePlayTypingIndicator";
import RolePlayComposer from "./RolePlayComposer";

/**
 * Step 4: the live scene.
 *
 * The transcript is the whole state — every mutation returns the updated
 * session and the parent writes it into the query cache, so this component
 * never holds a second copy of the conversation.
 */
export default function RolePlayStage({
  session,
  onSend,
  isSending = false,
  onFinish,
  isFinishing = false,
  onQuit,
  restoreText = "",
  restoreToken = 0,
}) {
  const transcriptRef = useRef(null);
  const scenario = session?.scenario;

  const turns = session?.turns || [];
  const isClosed = session?.status !== "IN_PROGRESS";
  const turnsRemaining = session?.turns_remaining ?? 0;
  const outOfTurns = turnsRemaining <= 0;

  // Keep the newest line in view as the scene grows, including while the
  // counterpart is "typing".
  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns.length, isSending]);

  if (!scenario) return null;

  const pressure = getPressureMeta(scenario.pressure_type);
  const PressureIcon = pressure.icon;
  const persona = getPersonaMeta(scenario.persona);

  let athleteTurnNumber = 0;

  return (
    <div className="space-y-4">
      <div className="bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm overflow-hidden">

        <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${pressure.tone}`}
          >
            <PressureIcon className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-cn-p-ink-2">
              {scenario.code} &middot; {scenario.relationship_display}
            </span>
            <h2 className="text-lg font-light text-cn-p-ink leading-tight mt-0.5">
              {scenario.title}
            </h2>
            <p className="text-xs text-cn-p-ink-2 font-light mt-2 leading-relaxed">{scenario.setup}</p>

            <div className="mt-3 rounded-xl bg-cn-p-page border border-cn-p-line p-3 flex gap-2.5">
              <Target className="w-3.5 h-3.5 text-cn-p-accent shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-cn-p-ink-2">
                  Your job
                </p>
                <p className="text-xs text-cn-p-ink font-light leading-relaxed mt-0.5">
                  {scenario.exercise}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onQuit}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg text-cn-p-ink-2 hover:text-cn-p-bad hover:bg-cn-p-bad-bg transition cursor-pointer shrink-0"
          >
            <DoorClosed className="w-3.5 h-3.5" />
            Walk away
          </button>
        </div>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-cn-p-line bg-cn-p-page flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cn-p-bad animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-cn-p-ink truncate">{scenario.counterpart_role}</p>
            <span className="text-[10px] font-semibold text-cn-p-ink-2 truncate">
              {session.persona_display}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-cn-p-ink-2 shrink-0">
            {persona.blurb}
          </span>
        </div>

        <div
          ref={transcriptRef}
          className="px-5 py-5 space-y-4 overflow-y-auto max-h-[52vh] min-h-[260px]"
        >
          {turns.map((turn) => {
            if (turn.speaker === "ATHLETE") athleteTurnNumber += 1;
            return (
              <RolePlayMessage
                key={turn.id}
                turn={turn}
                counterpartRole={scenario.counterpart_role}
                athleteTurnNumber={turn.speaker === "ATHLETE" ? athleteTurnNumber : null}
              />
            );
          })}

          {isSending && <RolePlayTypingIndicator counterpartRole={scenario.counterpart_role} />}
        </div>

        {session.counterpart_conceded && !isClosed && (
          <div className="px-5 py-3 bg-cn-p-soft border-t border-cn-p-accent-soft flex items-center gap-2">
            <Flag className="w-3.5 h-3.5 text-cn-p-accent shrink-0" />
            <p className="text-xs text-cn-p-accent font-light">
              They&apos;ve backed down. You can keep going, or finish and get scored.
            </p>
          </div>
        )}

        {outOfTurns && !isClosed && (
          <div className="px-5 py-3 bg-cn-p-warn/10 border-t border-cn-p-warn-bg flex items-center gap-2">
            <Flag className="w-3.5 h-3.5 text-cn-p-warn shrink-0" />
            <p className="text-xs text-cn-p-ink font-light">
              That&apos;s every reply in this scene. Finish it to see how you did.
            </p>
          </div>
        )}

        <RolePlayComposer
          onSend={onSend}
          isSending={isSending}
          disabled={isClosed || outOfTurns || isFinishing}
          turnsRemaining={turnsRemaining}
          restoreText={restoreText}
          restoreToken={restoreToken}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-cn-p-ink-2 font-light">
          {session.can_evaluate
            ? "Finish whenever you've said your piece — you'll be scored on the whole conversation."
            : "Hold the conversation a little longer before asking for a score."}
        </p>

        <button
          type="button"
          onClick={onFinish}
          disabled={!session.can_evaluate || isFinishing || isSending}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tabular-nums text-xs  rounded-xl shadow-sm transition cursor-pointer shrink-0"
        >
          {isFinishing ? (
            <>
              <div className="w-4 h-4 border-2 border-cn-p-card border-t-transparent rounded-full animate-spin" />
              Scoring your run...
            </>
          ) : (
            <>
              <ClipboardCheck className="w-4 h-4" />
              Finish &amp; get scored
            </>
          )}
        </button>
      </div>
    </div>
  );
}
