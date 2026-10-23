"use client";

import { motion } from "motion/react";
import { ArrowRight, ListOrdered } from "lucide-react";
import Link from "next/link";
import { getGuideIcon } from "./guideIcons";

/**
 * The guide's table of contents. Sticky on desktop, a horizontal scroller on
 * mobile — the same two-shape treatment the FAQ category rail below uses, so
 * the page reads as one system rather than two.
 */
export default function GuideChapterIndex({
  guide,
  activeChapterId,
  onSelect,
  portalHref,
}) {
  return (
    <>
      {/* Mobile chapter scroller */}
      <div className="lg:hidden -mx-6 px-6 flex gap-2 overflow-x-auto pb-1">
        {guide.chapters.map((chapter, index) => {
          const isActive = chapter.id === activeChapterId;
          return (
            <motion.button
              key={chapter.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelect(chapter.id)}
              className={`relative shrink-0 px-4 py-2 rounded-full text-xs font-sans font-semibold transition-colors duration-200 ${
                isActive
                  ? "text-paper"
                  : "bg-paper text-muted border border-line"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={`guide-mobile-pill-${guide.id}`}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className="absolute inset-0 bg-pine rounded-full shadow-soft"
                />
              )}
              <span className="relative z-10">
                {String(index + 1).padStart(2, "0")} &middot; {chapter.title}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Desktop sticky index */}
      <div className="hidden lg:block lg:sticky lg:top-28 space-y-6">
        <p className="text-ink font-sans uppercase tracking-widest text-xs font-semibold flex items-center gap-2">
          <ListOrdered className="w-3.5 h-3.5 text-gold" />
          In This Guide
        </p>

        <nav className="space-y-1">
          {guide.chapters.map((chapter, index) => {
            const Icon = getGuideIcon(chapter.icon);
            const isActive = chapter.id === activeChapterId;
            return (
              <button
                key={chapter.id}
                type="button"
                id={`btn-guide-chapter-${chapter.id}`}
                onClick={() => onSelect(chapter.id)}
                className={`relative w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-sans text-left transition-colors duration-200 ${
                  isActive
                    ? "text-ink font-semibold"
                    : "text-muted hover:text-ink hover:bg-paper/60"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={`guide-index-pill-${guide.id}`}
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    className="absolute inset-0 bg-paper border-l-2 border-pine rounded-xl shadow-soft"
                  />
                )}
                <span
                  className={`relative z-10 font-sans text-[11px] tabular-nums shrink-0 ${
                    isActive ? "text-gold" : "text-muted/70"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon
                  className={`relative z-10 w-4 h-4 shrink-0 ${
                    isActive ? "text-pine" : "text-muted/70"
                  }`}
                />
                <span className="relative z-10 leading-snug">
                  {chapter.title}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-line">
          <div className="bg-pine/5 border border-pine/15 rounded-card p-5">
            <p className="text-sm font-serif font-light text-ink mb-1.5">
              Ready to try it?
            </p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              The fastest way through this guide is to keep your portal open
              beside it.
            </p>
            <Link
              href={portalHref}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-pine hover:text-moss transition"
            >
              {guide.portalLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
