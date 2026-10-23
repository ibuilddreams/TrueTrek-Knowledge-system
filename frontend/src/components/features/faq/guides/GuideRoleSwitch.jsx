"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { getGuideIcon } from "./guideIcons";

/**
 * Picks which of the two guides is being read. Rendered as a pair of cards
 * rather than tabs because the choice is the first thing a visitor makes on
 * this section, and a card can carry who the guide is for.
 */
export default function GuideRoleSwitch({ guides, activeId, onSelect }) {
  return (
    <div
      role="tablist"
      aria-label="Choose a user guide"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {guides.map((guide) => {
        const Icon = getGuideIcon(guide.icon);
        const isActive = guide.id === activeId;
        const stepCount = guide.chapters.reduce(
          (sum, chapter) => sum + chapter.steps.length,
          0
        );

        return (
          <motion.button
            key={guide.id}
            type="button"
            role="tab"
            id={`btn-guide-role-${guide.id}`}
            aria-selected={isActive}
            aria-controls={`guide-panel-${guide.id}`}
            whileTap={{ scale: 0.985 }}
            onClick={() => onSelect(guide.id)}
            className={`group relative overflow-hidden text-left rounded-card border p-5 md:p-6 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
              isActive
                ? "bg-ink border-ink shadow-elevated"
                : "bg-paper border-line shadow-soft hover:border-pine/30 hover:shadow-elevated hover:-translate-y-0.5"
            }`}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gold/20 blur-[70px]"
              />
            )}

            <div className="relative flex items-start justify-between gap-4">
              <span
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-300 ${
                  isActive
                    ? "bg-gold/15 border-gold/30 text-gold"
                    : "bg-pine/[0.07] border-pine/15 text-pine"
                }`}
              >
                <Icon className="w-5.5 h-5.5" />
              </span>

              <span
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isActive
                    ? "bg-gold border-gold text-ink"
                    : "border-line text-transparent group-hover:border-pine/40"
                }`}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
            </div>

            <h3
              className={`relative mt-4 font-serif text-lg md:text-xl font-light tracking-tight transition-colors duration-300 ${
                isActive ? "text-paper" : "text-ink"
              }`}
            >
              {guide.label}
            </h3>
            <p
              className={`relative mt-1 font-sans text-xs uppercase tracking-widest font-medium transition-colors duration-300 ${
                isActive ? "text-gold" : "text-muted"
              }`}
            >
              {guide.audience}
            </p>

            <p
              className={`relative mt-3.5 font-sans text-[11px] uppercase tracking-widest transition-colors duration-300 ${
                isActive ? "text-sage/70" : "text-muted"
              }`}
            >
              {guide.chapters.length} chapters &middot; {stepCount} steps
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
