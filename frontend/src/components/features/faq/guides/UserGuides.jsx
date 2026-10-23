"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpenCheck, ExternalLink } from "lucide-react";
import { USER_GUIDES, DEFAULT_GUIDE_ID } from "@/constants/userGuides";
import { ROUTES } from "@/constants/routes";
import GuideRoleSwitch from "./GuideRoleSwitch";
import GuideChapterIndex from "./GuideChapterIndex";
import GuideChapter from "./GuideChapter";
import GuideQuickTips from "./GuideQuickTips";

/**
 * "How do I use this?" — the step-by-step companion to the Q&A below it.
 *
 * One chapter is shown at a time, chosen from the index on the left, so a guide
 * that runs to forty steps still reads as a page rather than a manual dump.
 */
export default function UserGuides() {
  const [activeGuideId, setActiveGuideId] = useState(DEFAULT_GUIDE_ID);
  const [activeChapterId, setActiveChapterId] = useState(
    USER_GUIDES.find((guide) => guide.id === DEFAULT_GUIDE_ID).chapters[0].id
  );
  const contentRef = useRef(null);

  const activeGuide = useMemo(
    () => USER_GUIDES.find((guide) => guide.id === activeGuideId) ?? USER_GUIDES[0],
    [activeGuideId]
  );

  const chapterIndex = Math.max(
    0,
    activeGuide.chapters.findIndex((chapter) => chapter.id === activeChapterId)
  );
  const activeChapter = activeGuide.chapters[chapterIndex];
  const portalHref = ROUTES[activeGuide.portalRoute] ?? ROUTES.HOME;

  // Bring the chapter panel back into view when the reader moves between
  // chapters — on mobile the index sits above the content, so a silent swap
  // would leave them looking at the rail they just used.
  const scrollToContent = useCallback(() => {
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const selectGuide = (guideId) => {
    if (guideId === activeGuideId) return;
    const guide = USER_GUIDES.find((entry) => entry.id === guideId);
    if (!guide) return;
    setActiveGuideId(guideId);
    setActiveChapterId(guide.chapters[0].id);
  };

  const selectChapter = (chapterId) => {
    if (chapterId === activeChapterId) return;
    setActiveChapterId(chapterId);
    scrollToContent();
  };

  const goToChapter = (offset) => {
    const next = activeGuide.chapters[chapterIndex + offset];
    if (!next) return;
    setActiveChapterId(next.id);
    scrollToContent();
  };

  const previousChapter = activeGuide.chapters[chapterIndex - 1];
  const nextChapter = activeGuide.chapters[chapterIndex + 1];

  return (
    <section id="user-guides" className="scroll-mt-24 mb-14 md:mb-16">
      {/* Section header */}
      <div data-reveal className="max-w-2xl mb-8">
        <span className="inline-flex items-center gap-2 text-gold font-sans uppercase tracking-widest text-xs font-medium mb-3">
          <BookOpenCheck className="w-3.5 h-3.5" />
          Step-by-Step User Guides
        </span>
        <h2 className="text-2xl md:text-4xl font-serif font-light tracking-tight text-ink leading-[1.05]">
          Learn the whole platform in one sitting.
        </h2>
        <p className="mt-3 font-sans text-sm md:text-base text-muted leading-relaxed">
          Two complete walkthroughs written in plain language — no technical
          knowledge assumed. Pick the one that describes you and work down the
          chapters in order.
        </p>
      </div>

      {/* Guide picker */}
      <div data-reveal data-reveal-delay="80">
        <GuideRoleSwitch
          guides={USER_GUIDES}
          activeId={activeGuideId}
          onSelect={selectGuide}
        />
      </div>

      {/* Active guide */}
      <div
        id={`guide-panel-${activeGuide.id}`}
        role="tabpanel"
        aria-labelledby={`btn-guide-role-${activeGuide.id}`}
        className="mt-8"
      >
        {/* Overview strip */}
        <motion.div
          key={`${activeGuide.id}-overview`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-paper border border-line rounded-panel shadow-soft p-6 md:p-7 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10"
        >
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-xl md:text-2xl font-light tracking-tight text-ink leading-snug">
              {activeGuide.headline}
            </h3>
            <p className="mt-2 font-sans text-sm text-muted leading-relaxed max-w-2xl">
              {activeGuide.summary}
            </p>
          </div>
          <Link
            id={`btn-guide-portal-${activeGuide.id}`}
            href={portalHref}
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper font-sans font-semibold uppercase tracking-widest text-xs px-6 py-3.5 rounded-full transition-colors duration-300 shadow-soft"
          >
            {activeGuide.portalLabel}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Index + chapter */}
        <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-start">
          <aside className="lg:col-span-3">
            <GuideChapterIndex
              guide={activeGuide}
              activeChapterId={activeChapter.id}
              onSelect={selectChapter}
              portalHref={portalHref}
            />
          </aside>

          <div ref={contentRef} className="lg:col-span-9 scroll-mt-24">
            <GuideChapter
              key={`${activeGuide.id}-${activeChapter.id}`}
              chapter={activeChapter}
              index={chapterIndex}
              total={activeGuide.chapters.length}
            />

            {/* Chapter pager */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                id="btn-guide-prev-chapter"
                onClick={() => goToChapter(-1)}
                disabled={!previousChapter}
                className="group flex-1 min-w-0 flex items-center gap-3 bg-paper border border-line rounded-card px-5 py-3.5 text-left shadow-soft transition-all duration-300 enabled:hover:border-pine/30 enabled:hover:shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 text-muted shrink-0 transition-colors group-enabled:group-hover:text-pine" />
                <span className="min-w-0">
                  <span className="block font-sans uppercase tracking-widest text-[10px] text-muted">
                    Previous
                  </span>
                  <span className="block font-serif text-sm font-light text-ink truncate">
                    {previousChapter?.title ?? "Start of guide"}
                  </span>
                </span>
              </button>

              <button
                type="button"
                id="btn-guide-next-chapter"
                onClick={() => goToChapter(1)}
                disabled={!nextChapter}
                className="group flex-1 min-w-0 flex items-center justify-end gap-3 bg-paper border border-line rounded-card px-5 py-3.5 text-right shadow-soft transition-all duration-300 enabled:hover:border-pine/30 enabled:hover:shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="min-w-0">
                  <span className="block font-sans uppercase tracking-widest text-[10px] text-muted">
                    Next
                  </span>
                  <span className="block font-serif text-sm font-light text-ink truncate">
                    {nextChapter?.title ?? "End of guide"}
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-muted shrink-0 transition-colors group-enabled:group-hover:text-pine" />
              </button>
            </div>

            <GuideQuickTips tips={activeGuide.quickTips} />
          </div>
        </div>
      </div>
    </section>
  );
}
