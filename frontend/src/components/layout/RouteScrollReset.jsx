"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Scrolls back to the top on every navigation inside the site route group.
//
// This used to sit behind a cross-fade (`ViewTransition`) that animated each
// route in and out. The animation is gone — it kept the outgoing page mounted
// over the incoming one, which is what made this explicit reset necessary in
// the first place — but the reset itself stays: it is what the previous
// behaviour did on every route change, and dropping it too would be a second,
// separate change to how navigation feels.
//
// `instant` rather than a smooth scroll: a new page should already be at the
// top when it paints, not travel there afterwards.
//
// Query-only changes (portal tabs) are deliberately not handled here — those
// own their own scroll position through setActiveTab.
export default function RouteScrollReset({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return children;
}
