"use client";

import { useEffect, useState } from "react";
import { formatCoursePrice } from "@/lib/store";
import PathwayCtaButton from "./PathwayCtaButton";

const CTA =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-xs font-sans font-bold uppercase tracking-widest text-ink transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed";

// Takes over from the hero's inline CTA once that scrolls out of view, so the
// price stays reachable while reading the roadmap without copying the course
// page's sticky right-hand rail.
export default function PathwayStickyBuyBar({ pathway, purchase, watchRef }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = watchRef.current;
    if (!target || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchRef]);

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base font-light tracking-tight text-ink">
            {pathway.name}
          </p>
          <p className="text-xs font-sans text-muted">
            {formatCoursePrice(pathway.base_price)} · lifetime access
          </p>
        </div>
        <PathwayCtaButton
          purchase={purchase}
          className={CTA}
          id="pathway-sticky-cta"
        />
      </div>
    </div>
  );
}
