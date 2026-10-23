"use client";

import { CircleCheck } from "lucide-react";

/**
 * The short troubleshooting grid that closes a guide — the handful of things
 * people get stuck on that do not belong to any one chapter.
 */
export default function GuideQuickTips({ tips }) {
  if (!tips?.length) return null;

  return (
    <section className="mt-6">
      <p className="font-sans uppercase tracking-widest text-[10px] font-bold text-gold mb-4">
        Good to Know
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tips.map((tip) => (
          <div
            key={tip.title}
            className="flex gap-3 bg-paper border border-line rounded-card p-5 shadow-soft hover:border-pine/25 transition-colors duration-300"
          >
            <CircleCheck className="w-4.5 h-4.5 text-pine shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="font-serif text-base font-light tracking-tight text-ink leading-snug">
                {tip.title}
              </h4>
              <p className="mt-1.5 font-sans text-sm text-muted leading-relaxed">
                {tip.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
