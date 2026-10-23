"use client";

import { motion } from "motion/react";
import { getGuideIcon } from "./guideIcons";
import GuideStep from "./GuideStep";

/**
 * The open chapter of a guide — header, then its steps as a numbered timeline.
 * Only one chapter is mounted at a time (the index on the left switches them),
 * which keeps the page short enough to read rather than scroll past.
 */
export default function GuideChapter({ chapter, index, total }) {
  const Icon = getGuideIcon(chapter.icon);

  return (
    <motion.article
      key={chapter.id}
      id={`guide-chapter-${chapter.id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-paper border border-line rounded-panel shadow-soft overflow-hidden"
    >
      <header className="border-b border-line bg-porcelain/50 px-6 md:px-8 py-6">
        <p className="font-sans uppercase tracking-widest text-[10px] font-bold text-gold mb-3">
          Chapter {index + 1} of {total}
        </p>
        <div className="flex items-start gap-4">
          <span className="w-11 h-11 rounded-xl bg-pine/10 border border-pine/15 text-pine flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xl md:text-2xl font-serif font-light tracking-tight text-ink leading-tight">
              {chapter.title}
            </h3>
            <p className="mt-1.5 font-sans text-sm text-muted leading-relaxed max-w-2xl">
              {chapter.summary}
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 md:px-8 py-7">
        <ol className="space-y-0">
          {chapter.steps.map((step, stepIndex) => (
            <GuideStep
              key={step.title}
              step={step}
              index={stepIndex}
              isLast={stepIndex === chapter.steps.length - 1}
            />
          ))}
        </ol>
      </div>
    </motion.article>
  );
}
