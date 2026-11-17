"use client";

import { useEffect, useRef, useState } from "react";

// A number that counts up to its value the first time it scrolls into view,
// the way the design animates the ledger figures: 1400ms on a quartic ease-out
// (`1 - (1 - p)^4`), so it moves fast and settles slowly.
//
// It runs its own observer rather than hanging off `useScrollReveal`, because
// that hook marks an element revealed with an attribute and never tells React
// about it — there is no render to hook a counter onto. Both watch the same
// element independently and agree on when it arrived.
//
// Without IntersectionObserver, or with reduced motion, the final value is
// rendered immediately: the number is the content, so it must never be left
// sitting at zero.
export default function CountUp({ value, className = "" }) {
  const target = Number(value) || 0;
  const ref = useRef(null);
  const [shown, setShown] = useState(target);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    setShown(0);
    setAnimate(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);

          const start = performance.now();
          const step = (now) => {
            const p = Math.min(1, (now - start) / 1400);
            setShown(Math.round(target * (1 - (1 - p) ** 4)));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <b ref={ref} className={className}>
      {(animate ? shown : target).toLocaleString()}
    </b>
  );
}
