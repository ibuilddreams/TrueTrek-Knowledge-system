"use client";

import { ShieldCheck, Target, TrendingUp } from "lucide-react";
import { PortalStat } from "../shell/PortalCard";

// The design's three tiles above the situations list: how far through the
// module you are, how you have scored, and the method you are scored against.
//
// The third is a legend rather than a figure — A.B.P. is what the rubric
// marks, so naming it where the scores are is the design's way of saying what
// the numbers beside it mean.
export default function WargamerStatStrip({ stats }) {
  if (!stats) return null;

  const total = stats.scenarios_total ?? 0;
  const runs = stats.runs_completed ?? 0;
  const average = stats.average_overall_score;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <PortalStat
        icon={Target}
        label="Situations passed"
        value={`${stats.scenarios_passed ?? 0} of ${total}`}
        hint={
          stats.module_complete
            ? "Module complete"
            : `Pass all ${total} to finish the module`
        }
      />
      <PortalStat
        icon={TrendingUp}
        tone="ok"
        label="Average score"
        value={average === null || average === undefined ? "—" : average}
        hint={runs === 0 ? "No runs scored yet" : `Across ${runs} run${runs === 1 ? "" : "s"}`}
      />
      <PortalStat
        icon={ShieldCheck}
        label="Method"
        value="A.B.P."
        hint="Acknowledge, boundary, pivot"
      />
    </div>
  );
}
