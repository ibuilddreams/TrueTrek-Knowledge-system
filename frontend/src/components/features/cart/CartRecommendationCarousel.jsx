"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ARROW_BUTTON =
  "absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-paper border border-line shadow-elevated text-ink hover:bg-pine hover:text-paper hover:border-pine flex items-center justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pine";

// Horizontal scroll-snap carousel: swipe/drag on touch, arrow buttons on
// desktop. Children should be `<li>` elements sized by the caller.
export default function CartRecommendationCarousel({ children, ariaLabel }) {
  const trackRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    updateArrows();
    track.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      track.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, children]);

  function scrollByPage(direction) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canScrollPrev && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          className={`${ARROW_BUTTON} -left-2 sm:-left-5`}
          aria-label="Previous courses"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <ul
        ref={trackRef}
        aria-label={ariaLabel}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-2 py-4 -mx-2 -my-4 scroll-px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>

      {canScrollNext && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          className={`${ARROW_BUTTON} -right-2 sm:-right-5`}
          aria-label="Next courses"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
