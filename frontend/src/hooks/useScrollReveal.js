"use client";

import { useEffect } from "react";

// Reveals every `[data-cn-reveal]` element inside `rootRef` once, as it
// scrolls into view — the motion the cobalt design system uses for section
// entry (see `.cn-reveal` in app/globals.css).
//
// The hidden state lives behind `[data-cn-js]` on <html>, which this hook is
// the only thing that sets. So a browser without JavaScript, without
// IntersectionObserver, or asking for reduced motion never hides anything in
// the first place, rather than relying on this hook to un-hide it.
//
// Revealed elements are marked with a `data-cn-in` **attribute**, never a
// class. React owns `className`: the moment a revealed element re-renders with
// a different class string — an accordion row that opens, a card that goes
// into the cart — React writes `node.className` wholesale and a class added
// here is wiped, dropping the element back to `opacity: 0` with the observer
// already unobserving it, so it never returns. React does not manage this
// attribute, so it survives every re-render.
//
// `deps` re-runs the sweep when the page grows new content (a list that
// arrived from the server, a panel that opened). Elements already revealed
// keep their mark, so re-running never flashes anything back out.
export default function useScrollReveal(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;

    const setup = () => {
      observer?.disconnect();
      observer = undefined;

      const targets = root.querySelectorAll("[data-cn-reveal]");

      if (motionQuery.matches || !("IntersectionObserver" in window)) {
        document.documentElement.removeAttribute("data-cn-js");
        targets.forEach((element) => element.setAttribute("data-cn-in", ""));
        return;
      }

      // Anything already on screen, or already scrolled past, is marked
      // revealed *before* the hidden state is switched on. Without this the
      // first client paint shows the content, the attribute then hides it,
      // and the observer — whose callback only runs on the next frame —
      // fades it back in: one frame of flicker on whatever sits at the fold.
      targets.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) {
          element.setAttribute("data-cn-in", "");
        }
      });

      document.documentElement.setAttribute("data-cn-js", "");
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.setAttribute("data-cn-in", "");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.08,
          // The enormous top margin is deliberate: it makes everything above
          // the viewport count as intersecting, so content the reader jumped
          // over — this page's own "#faq-topics" anchor skips most of one —
          // is revealed rather than left blank behind them. An element never
          // painted on the way past generates no intersection of its own, and
          // the observer unobserves on first hit, so without this it would sit
          // at `opacity: 0` for good. Below the viewport the margin stays
          // negative, so a row still rises into view before it reveals.
          rootMargin: "100000px 0px -40px 0px",
        },
      );
      targets.forEach((element) => observer.observe(element));
    };

    setup();
    motionQuery.addEventListener("change", setup);

    return () => {
      observer?.disconnect();
      motionQuery.removeEventListener("change", setup);
      // The attribute is global, so it must not outlive the page that set it
      // — another route's content would otherwise never be told to show.
      document.documentElement.removeAttribute("data-cn-js");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
