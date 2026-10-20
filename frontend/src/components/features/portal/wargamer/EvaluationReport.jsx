"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Coins,
  Lightbulb,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import BrandScoreGauge from "@/components/features/portal/brand/BrandScoreGauge";
import ReviewFindingList from "@/components/features/portal/brand/ReviewFindingList";
import RubricScoreCard from "./RubricScoreCard";
import IdealResponsePanel from "./IdealResponsePanel";
import CoachingNote from "./CoachingNote";
import RolePlayMessage from "./RolePlayMessage";
import { formatSeconds } from "./wargamerConstants";

/** Step 5: the report card. */
export default function EvaluationReport({
  session,
  stats,
  onRunAgain,
  onBackToScenarios,
  isRestarting = false,
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!session) return null;

  const scenario = session.scenario;
  const rubric = session.rubric || [];
  const boundarySeconds = formatSeconds(session.boundary_seconds);
  const target = stats?.time_to_boundary_target_seconds;

  let athleteTurnNumber = 0;

  return (
    <div className="space-y-5">
      <div className="bg-paper border border-line rounded-2xl shadow-sm overflow-hidden">
        <div
          className={`h-1 w-full bg-gradient-to-r opacity-80 ${
            session.passed ? "from-pine via-moss to-pine" : "from-clay via-gold to-clay"
          }`}
        />

        <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
          <BrandScoreGauge
            score={session.overall_score ?? 0}
            verdict={session.verdict}
            caption="Overall"
          />

          <div className="min-w-0 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                {scenario?.code} &middot; {scenario?.title}
              </span>
              <p className="text-sm text-ink font-light leading-relaxed mt-2">{session.summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {boundarySeconds && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted font-light">
                  <Timer className="w-3.5 h-3.5" />
                  Boundary set at{" "}
                  <span className="font-mono font-bold text-ink tabular-nums">
                    {boundarySeconds}
                  </span>
                  {target ? (
                    <span className="text-muted">
                      (target {target}s)
                    </span>
                  ) : null}
                </span>
              )}
              {session.points_awarded > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-light text-pine">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="font-mono font-bold tabular-nums">
                    +{session.points_awarded}
                  </span>{" "}
                  points added to your balance
                </span>
              )}
            </div>

            {!session.passed && (
              <div className="rounded-xl bg-rose/25 border border-clay/25 p-3.5">
                <p className="text-xs text-ink font-light leading-relaxed">
                  You didn&apos;t clear the {stats?.pass_score_percent ?? 70} pass mark this time,
                  so no points were awarded. Read the notes below and run it again &mdash; your
                  best score is the one that counts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {rubric.map((criterion) => (
          <RubricScoreCard
            key={criterion.key}
            criterion={criterion}
            caption={
              criterion.key === "time_to_boundary" && boundarySeconds
                ? `First clear no at ${boundarySeconds}`
                : null
            }
          />
        ))}
      </div>

      <CoachingNote note={session.used_fabricated_excuse ? session.fabrication_note : ""} />

      {session.suggested_response && (
        <div className="bg-paper border border-line rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-serif font-bold text-ink">Say it like this next time</h3>
          </div>
          <p className="text-sm text-ink font-light italic leading-relaxed">
            &ldquo;{session.suggested_response}&rdquo;
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReviewFindingList
          title="What you did well"
          icon={Sparkles}
          tone="positive"
          findings={session.strengths || []}
          emptyLabel="Nothing stood out as a strength this run — the notes above are where to start."
        />
        <ReviewFindingList
          title="What to change"
          icon={TrendingUp}
          tone="negative"
          findings={session.improvements || []}
          emptyLabel="No changes flagged — that was a clean run."
          numbered
        />
      </div>

      <IdealResponsePanel idealResponse={session.ideal_response} />

      <div className="bg-paper border border-line rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTranscript((previous) => !previous)}
          aria-expanded={showTranscript}
          className="w-full px-5 py-4 flex items-center gap-3 hover:bg-porcelain transition cursor-pointer text-left"
        >
          <Lightbulb className="w-4 h-4 text-muted shrink-0" />
          <span className="text-sm font-serif font-bold text-ink">
            {showTranscript ? "Hide" : "Read"} the conversation back
          </span>
          <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted">
            {session.athlete_turn_count} {session.athlete_turn_count === 1 ? "reply" : "replies"}
          </span>
        </button>

        {showTranscript && (
          <div className="px-5 pb-5 pt-1 space-y-4 border-t border-line">
            {(session.turns || []).map((turn) => {
              if (turn.speaker === "ATHLETE") athleteTurnNumber += 1;
              return (
                <RolePlayMessage
                  key={turn.id}
                  turn={turn}
                  counterpartRole={scenario?.counterpart_role}
                  athleteTurnNumber={turn.speaker === "ATHLETE" ? athleteTurnNumber : null}
                  isBoundaryTurn={
                    turn.speaker === "ATHLETE" && athleteTurnNumber === session.boundary_turn
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBackToScenarios}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider rounded-xl text-muted hover:text-ink hover:bg-porcelain transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All situations
        </button>

        <button
          type="button"
          onClick={onRunAgain}
          disabled={isRestarting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-pine hover:bg-moss disabled:opacity-50 disabled:cursor-not-allowed text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer"
        >
          {isRestarting ? (
            <>
              <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              Run this one again
            </>
          )}
        </button>
      </div>
    </div>
  );
}
