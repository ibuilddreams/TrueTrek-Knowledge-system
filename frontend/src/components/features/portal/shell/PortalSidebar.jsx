"use client";

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
export default function PortalSidebar({
  role,
  activeSlug,
  user,
  badges = {},
  isOpen = false,
  onNavigate,
}) {
  const groups = PORTAL_NAV_BY_ROLE[role] ?? [];

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
      <nav className="cn-p-scroll flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto">
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
                  href={portalHref(role, item.slug)}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onNavigate}
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
