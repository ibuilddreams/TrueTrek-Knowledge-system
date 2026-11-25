"use client";

import { Flame, Menu, Search } from "lucide-react";
import NotificationBell from "@/components/ui/NotificationBell";

// The design's `.top`: today's date over the page title, a search field, one
// role-specific chip and the notification bell. It sticks to the top of the
// content column, not the viewport's full width, because the sidebar is its
// own scroll container beside it.
//
// Below 60rem the search and the chip drop out and a menu button appears, as
// the design does — the bar has room for the title and the bell and nothing
// else on a phone.
function formatToday(date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function PortalTopbar({
  role,
  title,
  today,
  chip,
  onOpenNav,
  onSearch,
  searchPlaceholder = "Search courses, lessons, people",
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-cn-p-line bg-white/92 px-8 py-4 backdrop-blur-[8px] max-[60rem]:px-4 max-[60rem]:py-3">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="grid h-11 w-11 flex-none place-items-center rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card text-cn-p-ink transition-colors duration-150 hover:border-cn-p-ink min-[60.0625rem]:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-col">
        {today && <small className="text-[13px] text-cn-p-ink-2">{formatToday(today)}</small>}
        <h1 className="truncate text-[22px] font-bold tracking-[-0.01em] text-cn-p-ink">
          {title}
        </h1>
      </div>

      <label className="ml-auto flex h-11 w-[300px] items-center gap-2.5 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3.5 text-cn-p-ink-2 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-cn-p-accent max-[60rem]:hidden">
        <Search className="h-[18px] w-[18px] flex-none" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          aria-label="Search"
          onChange={(event) => onSearch?.(event.target.value)}
          className="w-full border-0 bg-transparent text-sm text-cn-p-ink outline-none"
        />
      </label>

      {chip ? <div className="max-[60rem]:hidden">{chip}</div> : null}

      <NotificationBell role={role} />
    </header>
  );
}

/** The student's streak chip, in the design's warm palette. */
export function StreakChip({ days = 0, onClick }) {
  const label = `${days}-day streak`;
  if (!onClick) {
    return (
      <span className="inline-flex h-11 items-center gap-2 rounded-cn-p-sm bg-cn-p-warn-bg px-3.5 font-semibold whitespace-nowrap text-cn-p-warn">
        <Flame className="h-[18px] w-[18px]" />
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-cn-p-sm bg-cn-p-warn-bg px-3.5 font-semibold whitespace-nowrap text-cn-p-warn transition-opacity duration-150 hover:opacity-85"
    >
      <Flame className="h-[18px] w-[18px]" />
      {label}
    </button>
  );
}
