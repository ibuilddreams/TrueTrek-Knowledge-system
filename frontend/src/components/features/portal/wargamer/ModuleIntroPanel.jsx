"use client";

import { ArrowRight, Mic, ShieldCheck, Target } from "lucide-react";

const OUTCOMES = [
  "Decline a financial ask from family without feeling you owe an explanation.",
  "Hold an event's rules with friends without wearing the accusation that you've changed.",
  "Protect your rest and pre-game routine against community pressure, and still sound grateful.",
];

/**
 * Step 1 of the module flow: what this is and what you'll walk away able to
 * do. Deliberately short — it's the screen between deciding to train and
 * actually training.
 */
export default function ModuleIntroPanel({ module, stats, onContinue }) {
  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-pine via-moss to-gold opacity-80" />

      <div className="p-6 sm:p-8 space-y-7">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pine text-paper flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            {module?.code && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                {module.code}
              </span>
            )}
            <h2 className="text-2xl font-serif font-light text-ink leading-tight">
              {module?.title || 'Tactical Wargamer: The "No" Muscle'}
            </h2>
          </div>
        </div>

        <div className="rounded-2xl bg-porcelain border border-line p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-pine" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Module objective
            </span>
          </div>
          <p className="text-sm text-ink font-light leading-relaxed">
            Build repeatable scripts for declining financial, access and time requests from
            family, friends and your community &mdash; without guilt, without a fight, and
            without damaging the relationship underneath.
          </p>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
            By the end of this module you can
          </p>
          <ul className="space-y-2.5">
            {OUTCOMES.map((outcome) => (
              <li key={outcome} className="flex gap-3">
                <ShieldCheck className="w-4 h-4 text-pine shrink-0 mt-0.5" />
                <span className="text-sm text-ink font-light leading-relaxed">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gold/25 bg-gold/8 p-5">
          <p className="text-sm text-ink font-light leading-relaxed">
            This is a <strong className="font-semibold">live simulator</strong>, not a reading
            exercise. You pick a situation, the other person pushes back in real time, and you
            have to hold your line until they stop. Then you get scored on how you did it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer"
          >
            Learn the A.B.P. Method
            <ArrowRight className="w-4 h-4" />
          </button>

          {stats?.scenarios_total > 0 && (
            <p className="text-xs text-muted font-light">
              <span className="font-mono font-bold text-ink tabular-nums">
                {stats.scenarios_passed}
              </span>{" "}
              of{" "}
              <span className="font-mono font-bold text-ink tabular-nums">
                {stats.scenarios_total}
              </span>{" "}
              situations passed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
