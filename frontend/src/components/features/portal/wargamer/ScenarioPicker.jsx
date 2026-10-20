"use client";

import { ArrowLeft, Swords } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ScenarioCard from "./ScenarioCard";
import WargamerStatStrip from "./WargamerStatStrip";

/** Step 3: pick the situation to practise. */
export default function ScenarioPicker({
  scenarios = [],
  stats,
  onBack,
  onStart,
  startingScenarioId = null,
}) {
  return (
    <div className="space-y-5">
      <WargamerStatStrip stats={stats} />

      <div className="bg-paper border border-line rounded-2xl shadow-sm p-5 sm:p-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
          Choose a situation
        </span>
        <h2 className="text-xl font-serif font-light text-ink mt-1">
          Which conversation do you want to practise?
        </h2>
        <p className="text-sm text-muted font-light mt-2 leading-relaxed max-w-2xl">
          Each one is a different kind of pressure &mdash; money, access, or your time. The other
          person won&apos;t accept a soft no, so plan your Acknowledge, your Boundary and your
          Pivot before you open it.
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="bg-paper border border-line rounded-2xl p-6">
          <EmptyState
            size="lg"
            icon={Swords}
            label="No situations published yet."
            description="Your academy hasn't published any role-play situations for this module yet. Check back soon."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStart={onStart}
              isStarting={startingScenarioId === scenario.id}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider rounded-xl text-muted hover:text-ink hover:bg-porcelain transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to the method
      </button>
    </div>
  );
}
