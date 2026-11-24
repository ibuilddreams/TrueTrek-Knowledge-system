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
// **New content is found by watching the DOM, not by `deps`.** `deps` can only
// describe the render that schedules the effect, and on a paginated list that
// is the wrong render: with TanStack Query's `keepPreviousData` the page number
// changes while the *previous* page's cards are still mounted, and when the new
// rows finally arrive they replace every node (the cards are keyed by id) under
// a dep list that has not moved — `courses.length` is 9 before and after. The
// sweep therefore ran against the old nodes and never saw the new ones, which
// stayed at `opacity: 0` for good: a blank grid on page 2. The same held for
// any filter that swapped one full page of results for another. A
// MutationObserver reveals exactly when the content it is responsible for
// actually changes, so callers cannot get this wrong by choosing the wrong
// dependency. `deps` is kept for re-running the whole setup (a new root, a
// route change) and is harmless to over-specify.
export default function useScrollReveal(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;
    let mutationObserver;
    let frame = 0;
    // Which elements are already being watched. Nodes are dropped from the DOM
    // wholesale on a page change, so this is a WeakSet rather than a count.
    let tracked = new WeakSet();

    const sweep = (isInitial) => {
      const targets = root.querySelectorAll("[data-cn-reveal]");

      // No observer means reduced motion or no IntersectionObserver: nothing is
      // ever hidden, so everything is simply shown, new arrivals included.
      if (!observer) {
        document.documentElement.removeAttribute("data-cn-js");
        targets.forEach((element) => element.setAttribute("data-cn-in", ""));
        return;
      }

      if (isInitial) {
        // Anything already on screen, or already scrolled past, is marked
        // revealed *before* the hidden state is switched on. Without this the
        // first client paint shows the content, the attribute then hides it,
        // and the observer — whose callback only runs on the next frame —
        // fades it back in: one frame of flicker on whatever sits at the fold.
        //
        // Only on the initial sweep. Content that arrives later is already
        // under `[data-cn-js]`, so letting the observer mark it is what gives a
        // new page of cards its fade-in rather than popping them in at once.
        targets.forEach((element) => {
          if (element.getBoundingClientRect().top < window.innerHeight) {
            element.setAttribute("data-cn-in", "");
          }
        });
        document.documentElement.setAttribute("data-cn-js", "");
      }

      targets.forEach((element) => {
        if (tracked.has(element) || element.hasAttribute("data-cn-in")) return;
        tracked.add(element);
        observer.observe(element);
      });
    };

    const setup = () => {
      observer?.disconnect();
      observer = undefined;
      tracked = new WeakSet();

      if (!motionQuery.matches && "IntersectionObserver" in window) {
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
      }

      sweep(true);
    };

    setup();
    motionQuery.addEventListener("change", setup);

    // Catches every later arrival: a new page of cards, a filter that swapped
    // the results, a panel that opened. Coalesced to one pass per frame, since
    // a React commit lands as a burst of records. Only `childList` is watched,
    // so the `data-cn-in` attributes written above cannot retrigger it.
    mutationObserver = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        sweep(false);
      });
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mutationObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
      motionQuery.removeEventListener("change", setup);
      // The attribute is global, so it must not outlive the page that set it
      // — another route's content would otherwise never be told to show.
      document.documentElement.removeAttribute("data-cn-js");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
