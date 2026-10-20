"use client";

import { Coins, Gauge, ShieldCheck, Trophy } from "lucide-react";
import { getScoreTone } from "./wargamerConstants";

function Stat({ icon: Icon, label, value, hint, tone = "text-ink" }) {
  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-porcelain border border-line text-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{label}</p>
        <p className={`text-lg font-serif font-light tabular-nums leading-tight mt-0.5 ${tone}`}>
          {value}
        </p>
        {hint && <p className="text-[11px] text-muted font-light mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

/** Module progress above the scenario picker. */
export default function WargamerStatStrip({ stats }) {
  if (!stats) return null;

  const best = stats.best_overall_score;
  const average = stats.average_overall_score;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Stat
        icon={ShieldCheck}
        label="Situations passed"
        value={`${stats.scenarios_passed} / ${stats.scenarios_total}`}
        hint={stats.module_complete ? "Module complete" : `Pass mark is ${stats.pass_score_percent}`}
      />
      <Stat
        icon={Trophy}
        label="Best score"
        value={best ?? "—"}
        tone={getScoreTone(best)}
        hint={`${stats.runs_completed} run${stats.runs_completed === 1 ? "" : "s"} scored`}
      />
      <Stat
        icon={Gauge}
        label="Average score"
        value={average ?? "—"}
        tone={getScoreTone(average)}
        hint={
          average === null || average === undefined
            ? "No runs scored yet"
            : `Tone ${stats.average_tone_control} · Policy ${stats.average_deflection_to_policy}`
        }
      />
      <Stat
        icon={Coins}
        label="Points earned"
        value={(stats.points_earned ?? 0).toLocaleString()}
        hint="Paid into your rewards balance"
      />
    </div>
  );
}
