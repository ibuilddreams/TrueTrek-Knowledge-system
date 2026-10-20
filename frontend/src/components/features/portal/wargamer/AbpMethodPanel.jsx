"use client";

import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { ABP_STEPS } from "./wargamerConstants";

/**
 * Step 2: the technique itself, before any pressure is applied.
 *
 * The examples here are generic on purpose. The model answer written for the
 * *specific* situation the student is about to walk into stays hidden until
 * their run has been scored (the backend doesn't even serialize it before
 * then) — otherwise the exercise is transcription, not practice.
 */
export default function AbpMethodPanel({ onBack, onContinue }) {
  return (
    <div className="space-y-5">
      <div className="bg-paper border border-line rounded-2xl shadow-sm p-6 sm:p-7">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
          The foundational framework
        </span>
        <h2 className="text-xl font-serif font-light text-ink mt-1">The A.B.P. Method</h2>
        <p className="text-sm text-muted font-light mt-2 leading-relaxed max-w-2xl">
          Three moves, always in this order. Acknowledge first so the no doesn&apos;t land cold,
          state the boundary against something you already do, then give them somewhere else to
          go so the conversation can end well.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ABP_STEPS.map((step, index) => (
          <div
            key={step.key}
            className="relative bg-paper border border-line rounded-2xl shadow-sm p-5 flex flex-col gap-3 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-70" />

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-pine text-paper flex items-center justify-center shrink-0 font-serif text-xl font-bold">
                {step.letter}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-serif font-bold text-ink leading-tight">
                  {step.label}
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                  Step {index + 1}
                </span>
              </div>
            </div>

            <p className="text-sm text-ink font-light leading-relaxed">{step.summary}</p>
            <p className="text-xs text-muted font-light leading-relaxed">{step.detail}</p>

            <div className="mt-auto rounded-xl bg-porcelain border border-line p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
                Sounds like
              </p>
              <p className="text-xs text-ink font-light italic leading-relaxed">{step.example}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gold/25 bg-gold/8 p-5 flex gap-3">
        <Lightbulb className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">
            One rule about the boundary
          </p>
          <p className="text-sm text-ink font-light leading-relaxed">
            Point at something that is actually true. An invented agent or a manager you
            don&apos;t have buys you one conversation and collapses the next time they ask. A
            real training schedule, a team rule or a budget you set yourself holds up for
            years &mdash; and you&apos;ll be scored on which one you used.
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider rounded-xl text-muted hover:text-ink hover:bg-porcelain transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer"
        >
          Choose a situation
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
