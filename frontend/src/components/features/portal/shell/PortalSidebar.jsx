"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { PORTAL_NAV_BY_ROLE, portalHref } from "./portalNav";
import PortalAccountMenu from "./PortalAccountMenu";

// The design's `.side`: a 260px rail of grouped links with the wordmark above
// and the account button pinned to the bottom. Below 60rem it becomes a
// drawer that slides in over the content, which is what `isOpen` drives.
//
// Three rows, and only the middle one scrolls. The rail used to scroll as a
// whole, which meant the account button was simply off the bottom of a long
// navigation — the admin's is six groups and twenty-three links — and the
// only way to reach it was to scroll the wordmark away first. Pinning both
// ends and giving the links their own scroll container costs nothing on a
// short navigation and makes the long ones behave.

// Where the link list had got to, remembered per role.
//
// Every portal route is a `[[...slug]]` catch-all, so moving between tabs
// gives the segment a new param and Next remounts the whole page subtree —
// this rail included. Without this the nav came back at the top on every
// navigation, which on the admin's twenty-three links scrolled the item you
// had just tapped out of sight. `sessionStorage` rather than a module
// variable so a reload or a back/forward lands in the same place too; it is
// a convenience, so every access is guarded and a failure is simply a rail
// that starts at the top.
const SCROLL_KEY_PREFIX = "cn-portal-nav-scroll:";

function readStoredScroll(role) {
  try {
    const stored = window.sessionStorage.getItem(`${SCROLL_KEY_PREFIX}${role}`);
    const value = Number(stored);
    return stored !== null && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStoredScroll(role, value) {
  try {
    window.sessionStorage.setItem(`${SCROLL_KEY_PREFIX}${role}`, String(value));
  } catch {
    /* Private browsing, a full quota — not worth failing navigation over. */
  }
}

export default function PortalSidebar({
  role,
  activeSlug,
  user,
  badges = {},
  isOpen = false,
  onNavigate,
}) {
  const groups = PORTAL_NAV_BY_ROLE[role] ?? [];
  const navRef = useRef(null);
  const activeRef = useRef(null);

  // `useLayoutEffect` so the restore happens before the browser paints: in an
  // effect the rail is visibly at the top for a frame first.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const stored = readStoredScroll(role);
    if (stored !== null) {
      // An out-of-range value is clamped by the browser, so a navigation
      // shortening the list cannot strand the rail past its end.
      nav.scrollTop = stored;
      return;
    }

    // Nothing remembered — a fresh session, or a deep link straight to a tab
    // near the bottom. Put the current page's link on screen rather than
    // leaving the viewer to find it. Measured off the two rects rather than
    // `offsetTop`, whose offset parent here is the `aside` (it is `sticky`
    // above 60rem and `fixed` below, so it is positioned either way) and not
    // the nav — that reads a link as a wordmark's height lower than it is.
    const active = activeRef.current;
    if (!active) return;

    const top = active.getBoundingClientRect().top - nav.getBoundingClientRect().top;
    if (top + active.offsetHeight > nav.clientHeight) {
      nav.scrollTop = top - (nav.clientHeight - active.offsetHeight) / 2;
    }
  }, [role]);

  // Writing on every scroll event would hit `sessionStorage` dozens of times
  // a flick, so the write is coalesced onto an animation frame.
  const frameRef = useRef(0);
  const onScroll = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      if (navRef.current) writeStoredScroll(role, navRef.current.scrollTop);
    });
  }, [role]);

  useLayoutEffect(
    () => () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  return (
    <aside
      aria-label="Portal navigation"
      className={`flex h-screen w-[260px] flex-col gap-6 overflow-hidden border-r border-cn-p-line bg-cn-p-card px-4 py-6 max-[60rem]:fixed max-[60rem]:top-0 max-[60rem]:left-0 max-[60rem]:z-[55] max-[60rem]:w-[280px] max-[60rem]:transition-transform max-[60rem]:duration-200 min-[60.0625rem]:sticky min-[60.0625rem]:top-0 ${
        isOpen
          ? "max-[60rem]:translate-x-0 max-[60rem]:shadow-cn-p"
          : "max-[60rem]:-translate-x-full"
      }`}
    >
      <div className="flex h-11 flex-none items-center px-2">
        <Link href={ROUTES.HOME} aria-label="Cool Nerdz home">
          {/* The same wordmark the site header uses, at the design's 30px
              sidebar height (the artwork is 480x115). */}
          <img
            src="/images/coolnerdz-wordmark.png"
            alt="Cool Nerdz"
            width={480}
            height={115}
            className="h-[30px] w-auto object-contain"
          />
        </Link>
      </div>

      {/* `min-h-0` is what actually lets this shrink: a flex child's default
          `min-height: auto` refuses to go below its content, so without it the
          nav would push the account button off the rail instead of scrolling. */}
      <nav
        ref={navRef}
        onScroll={onScroll}
        className="cn-p-scroll flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto"
      >
        {groups.map((group) => (
          <div key={group.heading} className="flex flex-col gap-0.5">
            <p className="mb-1.5 px-3 text-[11px] font-bold tracking-[0.1em] text-cn-p-muted uppercase">
              {group.heading}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.slug === activeSlug;
              const badge = item.badge ? badges[item.badge] : null;
              return (
                <Link
                  key={item.slug}
                  ref={isActive ? activeRef : undefined}
                  href={portalHref(role, item.slug)}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(event) => {
                    // The rail is about to be torn down by the navigation, so
                    // commit where it is now instead of waiting for the
                    // queued frame that will never run.
                    if (navRef.current) writeStoredScroll(role, navRef.current.scrollTop);
                    onNavigate?.(event);
                  }}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-cn-p-sm px-3 text-sm no-underline transition-colors duration-[120ms] ${
                    isActive
                      ? "bg-cn-p-accent font-semibold text-white"
                      : "font-medium text-cn-p-ink-2 hover:bg-cn-p-page hover:text-cn-p-ink"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-none" strokeWidth={1.9} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badge ? (
                    <span
                      className={`grid h-[22px] min-w-[22px] place-items-center rounded-full px-[7px] text-xs font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-cn-p-soft text-cn-p-soft-ink"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex-none">
        <PortalAccountMenu role={role} name={user?.name} />
      </div>
    </aside>
  );
}
