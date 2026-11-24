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
      <div className="bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-6 sm:p-7">
        <span className="text-[10px] font-semibold text-cn-p-ink-2">
          The foundational framework
        </span>
        <h2 className="text-xl font-light text-cn-p-ink mt-1">The A.B.P. Method</h2>
        <p className="text-sm text-cn-p-ink-2 font-light mt-2 leading-relaxed max-w-2xl">
          Three moves, always in this order. Acknowledge first so the no doesn&apos;t land cold,
          state the boundary against something you already do, then give them somewhere else to
          go so the conversation can end well.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ABP_STEPS.map((step, index) => (
          <div
            key={step.key}
            className="relative bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-5 flex flex-col gap-3 overflow-hidden"
          >

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cn-p-accent text-white flex items-center justify-center shrink-0 text-xl font-bold">
                {step.letter}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-cn-p-ink leading-tight">
                  {step.label}
                </h3>
                <span className="text-[10px] font-semibold text-cn-p-ink-2">
                  Step {index + 1}
                </span>
              </div>
            </div>

            <p className="text-sm text-cn-p-ink font-light leading-relaxed">{step.summary}</p>
            <p className="text-xs text-cn-p-ink-2 font-light leading-relaxed">{step.detail}</p>

            <div className="mt-auto rounded-xl bg-cn-p-page border border-cn-p-line p-3">
              <p className="text-[10px] font-semibold text-cn-p-ink-2 mb-1">
                Sounds like
              </p>
              <p className="text-xs text-cn-p-ink font-light italic leading-relaxed">{step.example}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-cn-p-warn-bg bg-cn-p-warn-bg p-5 flex gap-3">
        <Lightbulb className="w-4 h-4 text-cn-p-warn shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-cn-p-ink-2 mb-1">
            One rule about the boundary
          </p>
          <p className="text-sm text-cn-p-ink font-light leading-relaxed">
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
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl text-cn-p-ink-2 hover:text-cn-p-ink hover:bg-cn-p-page transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-bold tabular-nums text-xs  rounded-xl shadow-sm transition cursor-pointer"
        >
          Choose a situation
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
