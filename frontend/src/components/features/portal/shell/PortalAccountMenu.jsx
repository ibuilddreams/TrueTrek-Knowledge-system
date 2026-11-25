"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Mail, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLogoutFlow } from "@/hooks/useLogoutFlow";
import { AUTH_ROLES } from "@/constants/auth";
import { portalHref } from "./portalNav";

// The design's `.pop.menu` hung off the sidebar's account button: who is
// signed in, then profile, messages and sign out.
//
// It opens *upward* — the button it belongs to is pinned to the bottom of a
// full-height rail, so a menu dropping down would open off the screen.
//
// Signing out goes through `useLogoutFlow`, the same path the site header
// uses: it clears the session, shows the full-screen logout overlay and
// lands on /login. Doing it here by hand would skip the overlay and leave a
// stale Redux user behind.
const ROLE_LABEL = {
  [AUTH_ROLES.STUDENT]: "Student",
  [AUTH_ROLES.FACULTY]: "Teacher",
  [AUTH_ROLES.ADMIN]: "Admin",
};

function initialsOf(name) {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "CN";
}

export default function PortalAccountMenu({ role, name }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isSigningOut, signOut } = useLogoutFlow();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const displayName = name || user?.name || "Your account";

  // A click anywhere else closes it. `mousedown` rather than `click` so the
  // menu is gone before whatever was clicked reacts.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const go = (href) => {
    setIsOpen(false);
    router.push(href);
  };

  // The design's `.pop .pi` — a 12px row with a 10px radius, and no rule
  // between the rows or under the header.
  const ITEM =
    "flex w-full items-center gap-3 rounded-cn-p-sm p-3 text-left text-sm text-cn-p-ink transition-colors duration-150 hover:bg-cn-p-page disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div ref={wrapperRef} className="relative mt-auto">
      {isOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute bottom-full left-0 z-40 mb-2 w-full min-w-[240px] rounded-[14px] border border-cn-p-line bg-cn-p-card p-2 shadow-cn-p"
        >
          <div className="flex items-center gap-3 p-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-cn-p-soft text-[13px] font-bold text-cn-p-soft-ink">
              {initialsOf(displayName)}
            </span>
            <span className="grid min-w-0">
              <b className="truncate text-sm text-cn-p-ink">{displayName}</b>
              {user?.email && (
                <span className="truncate text-xs text-cn-p-ink-2">
                  {user.email}
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            className={ITEM}
            onClick={() => go(portalHref(role, "profile"))}
          >
            <UserRound className="h-[18px] w-[18px] flex-none text-cn-p-ink-2" />
            Profile &amp; settings
          </button>

          <button
            type="button"
            role="menuitem"
            className={ITEM}
            onClick={() => go(portalHref(role, "messages"))}
          >
            <Mail className="h-[18px] w-[18px] flex-none text-cn-p-ink-2" />
            Messages
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={isSigningOut}
            onClick={signOut}
            className={ITEM}
          >
            <LogOut className="h-[18px] w-[18px] flex-none text-cn-p-ink-2" />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 rounded-xl bg-cn-p-page p-3 text-left transition-colors duration-150 hover:bg-cn-p-soft"
      >
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-cn-p-soft text-xs font-bold text-cn-p-soft-ink">
          {initialsOf(displayName)}
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-semibold text-cn-p-ink">
            {displayName}
          </span>
          <span className="truncate text-xs text-cn-p-muted">
            {ROLE_LABEL[role] || "Member"}
          </span>
        </span>
        <ChevronUp
          className={`h-4 w-4 flex-none text-cn-p-muted transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}
