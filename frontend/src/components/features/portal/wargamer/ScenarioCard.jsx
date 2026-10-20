"use client";

import { CheckCircle2, Play, RotateCcw, Trophy } from "lucide-react";
import {
  DIFFICULTY_TONE,
  getPersonaMeta,
  getPressureMeta,
  getScoreTone,
} from "./wargamerConstants";

/**
 * One situation on the picker. Carries the student's own progress against it
 * (best score, attempts, and whether a half-finished conversation is waiting
 * to be resumed) so the primary action is always the right one.
 */
export default function ScenarioCard({ scenario, onStart, isStarting = false }) {
  const pressure = getPressureMeta(scenario.pressure_type);
  const PressureIcon = pressure.icon;
  const persona = getPersonaMeta(scenario.persona);
  const PersonaIcon = persona.icon;

  const hasActiveSession = Boolean(scenario.active_session_id);
  const hasScore = scenario.best_score !== null && scenario.best_score !== undefined;

  const actionLabel = hasActiveSession
    ? "Resume conversation"
    : scenario.attempts > 0
      ? "Run it again"
      : "Start role-play";
  const ActionIcon = hasActiveSession ? RotateCcw : Play;

  return (
    <div
      className={`relative bg-paper border rounded-2xl shadow-sm p-5 flex flex-col gap-4 overflow-hidden transition-colors ${
        scenario.passed ? "border-pine/30" : "border-line"
      }`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-80 ${
          scenario.passed ? "from-pine via-moss to-pine" : "from-pine via-moss to-gold"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${pressure.tone}`}
        >
          <PressureIcon className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-semibold">
            {scenario.relationship_display}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border shrink-0 ${
              DIFFICULTY_TONE[scenario.difficulty] || DIFFICULTY_TONE.MEDIUM
            }`}
          >
            {scenario.difficulty_display}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            {scenario.code}
          </span>
          {scenario.passed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-pine">
              <CheckCircle2 className="w-3 h-3" />
              Passed
            </span>
          )}
        </div>
        <h3 className="text-base font-serif font-bold text-ink leading-snug mt-1">
          {scenario.title}
        </h3>
        <p className="text-xs text-muted font-light mt-1.5 leading-relaxed line-clamp-3">
          {scenario.setup}
        </p>
      </div>

      <div className="rounded-xl bg-porcelain border border-line p-3 flex gap-2.5">
        <div
          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${persona.tone}`}
        >
          <PersonaIcon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
            {scenario.counterpart_role} &middot; {scenario.persona_display}
          </p>
          <p className="text-xs text-ink font-light leading-relaxed mt-0.5">{persona.blurb}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] flex-wrap">
        <span className="font-mono font-bold text-ink tabular-nums">
          +{scenario.points_reward}
          <span className="font-sans font-normal text-muted ml-1">pts</span>
        </span>
        <span className="text-muted font-light">{scenario.key_skill}</span>
        {hasScore && (
          <span className="inline-flex items-center gap-1 ml-auto">
            <Trophy className="w-3 h-3 text-muted" />
            <span className={`font-mono font-bold tabular-nums ${getScoreTone(scenario.best_score)}`}>
              {scenario.best_score}
            </span>
            <span className="text-muted font-light">best</span>
          </span>
        )}
      </div>

      <div className="mt-auto pt-1">
        <button
          type="button"
          onClick={() => onStart?.(scenario)}
          disabled={isStarting}
          className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold font-mono uppercase tracking-wider rounded-xl bg-pine hover:bg-moss text-paper shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isStarting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <ActionIcon className="w-4 h-4" />
              {actionLabel}
            </>
          )}
        </button>
        {scenario.attempts > 0 && (
          <p className="text-[11px] text-muted font-light text-center mt-2">
            {scenario.attempts} previous {scenario.attempts === 1 ? "run" : "runs"}
          </p>
        )}
      </div>
    </div>
  );
}
