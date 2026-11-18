"use client";

import { useEffect, useState } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalTopbar from "./PortalTopbar";
import { portalTitle } from "./portalNav";

/**
 * The frame every signed-in screen sits in: the design's `.app` grid — a
 * 260px sidebar beside a scrolling content column with its own sticky top
 * bar.
 *
 * All three roles use this. What differs between them is the navigation
 * (`portalNav.js`), the top bar's chip, and the screen rendered as children —
 * nothing about the frame itself, which is why there is one of it rather than
 * three that drift.
 *
 * Below 60rem the grid collapses to a single column and the sidebar becomes a
 * drawer over the content, dismissed by the scrim or by following a link.
 */
export default function PortalShell({
  role,
  activeSlug,
  user,
  badges,
  chip,
  title,
  today,
  unreadCount,
  onOpenNotifications,
  onSearch,
  children,
}) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  // A drawer left open while the viewport grows would sit over the content
  // with no way back, since the button that closes it is hidden above 60rem.
  useEffect(() => {
    if (!isNavOpen) return undefined;
    const media = window.matchMedia("(min-width: 60.0625rem)");
    const close = () => setIsNavOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, [isNavOpen]);

  // Escape closes the drawer, as it does every other overlay here.
  useEffect(() => {
    if (!isNavOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isNavOpen]);

  return (
    <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] bg-cn-p-page text-sm leading-[1.5] text-cn-p-ink max-[60rem]:grid-cols-[minmax(0,1fr)]">
      <PortalSidebar
        role={role}
        activeSlug={activeSlug}
        user={user}
        badges={badges}
        isOpen={isNavOpen}
        onNavigate={() => setIsNavOpen(false)}
      />

      {/* The scrim exists only while the drawer does, so it can never swallow
          clicks on a desktop layout that has no drawer. */}
      {isNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsNavOpen(false)}
          className="fixed inset-0 z-[54] bg-cn-p-ink/40 min-[60.0625rem]:hidden"
        />
      )}

      <div className="flex min-w-0 flex-col">
        <PortalTopbar
          title={title ?? portalTitle(role, activeSlug)}
          today={today}
          chip={chip}
          unreadCount={unreadCount}
          onOpenNav={() => setIsNavOpen(true)}
          onOpenNotifications={onOpenNotifications}
          onSearch={onSearch}
        />
        <main
          id="portal-main"
          className="flex w-full max-w-[1440px] flex-col gap-5 px-8 pt-7 pb-16 max-[60rem]:px-4 max-[60rem]:pt-5 max-[60rem]:pb-20"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
