"use client";

import { Play, RotateCcw, Target } from "lucide-react";
import PortalCard, { PortalCardHead } from "../shell/PortalCard";
import { PortalButton, PortalEmpty, PortalPill } from "../shell/PortalUI";

// The design's "Situations" card: one row per situation — who you are about to
// talk to, how you did last time, and the one button that starts it.
//
// It replaced a grid of cards. A row carries everything the card did that the
// reader acts on, and the design puts this beside "Past runs" rather than
// across the page, which a three-column grid cannot do.
function statusOf(scenario) {
  if (scenario.active_session_id) return { label: "In progress", tone: "warn" };
  if (scenario.passed) return { label: "Passed", tone: "ok" };
  if (scenario.attempts > 0) return { label: "Not passed", tone: "bad" };
  return { label: "Not started", tone: "neutral" };
}

export default function ScenarioPicker({
  scenarios = [],
  onStart,
  startingScenarioId = null,
  onShowBriefing,
}) {
  return (
    <PortalCard>
      {/* The module briefing and the A.B.P. primer are opened from here now.
          They used to be a first-run gate in front of this list, which the
          design has no step for — and a student who already knows the method
          had to click past it to reach the thing they came for. */}
      <PortalCardHead
        title="Situations"
        action={onShowBriefing ? "How this works" : undefined}
        onAction={onShowBriefing}
      />

      {scenarios.length === 0 ? (
        <PortalEmpty
          icon={Target}
          title="No situations published yet"
          text="Your academy hasn't published any role-play situations for this module yet."
        />
      ) : (
        <ul className="m-0 list-none p-0">
          {scenarios.map((scenario) => {
            const status = statusOf(scenario);
            const isResuming = Boolean(scenario.active_session_id);
            const label = isResuming
              ? "Resume"
              : scenario.attempts > 0
                ? "Retry"
                : "Start";
            const ActionIcon = isResuming ? RotateCcw : Play;
            return (
              <li
                key={scenario.id}
                className="flex items-center gap-3 border-t border-cn-p-line px-5 py-3.5 first:border-t-0"
              >
                <span className="grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink">
                  <Target className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block font-semibold text-cn-p-ink">{scenario.title}</b>
                  <span className="block text-[13px] text-cn-p-muted">
                    Role-play with{" "}
                    {scenario.counterpart_role || scenario.persona_display || "a counterpart"}
                  </span>
                </span>
                {scenario.best_score !== null && scenario.best_score !== undefined && (
                  <b className="hidden flex-none tabular-nums text-cn-p-ink sm:block">
                    {scenario.best_score}
                  </b>
                )}
                <PortalPill tone={status.tone}>{status.label}</PortalPill>
                <PortalButton
                  variant="sec"
                  size="sm"
                  disabled={startingScenarioId === scenario.id}
                  onClick={() => onStart(scenario)}
                  className="flex-none"
                >
                  <ActionIcon className="h-3.5 w-3.5" />
                  {startingScenarioId === scenario.id ? "Opening..." : label}
                </PortalButton>
              </li>
            );
          })}
        </ul>
      )}
    </PortalCard>
  );
}
