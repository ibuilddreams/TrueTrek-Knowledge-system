"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

// A group header is keyed by its own tab id when it has one (Dashboard) and by
// its label otherwise (Daily Activity), so both kinds get a stable key for the
// open/closed map without a group needing an id it has no panel for.
const groupKey = (entry) => entry.id ?? entry.label;

const hasChildren = (entry) => Boolean(entry.children?.length);

// Top-level entries are rows on one shared panel; sub-items are the quieter
// rows beneath them. Keeping the two as separate renderers is what makes the
// hierarchy read at a glance — a bordered card nested inside a bordered card
// gives both the same weight.
//
// A top-level row carries its `tab.title` as a second line, clamped to two
// lines so one long description can't push a row to three. Sub-items stay
// label-only — the parent already says what the section is, and repeating that
// detail one level down is what made the nav read as a column of paragraphs.
function SidebarRow({
  tab,
  isActive,
  // A collapsed group whose active tab is hidden inside it — tinted, but never
  // the full selected treatment, so only one row ever reads as "you are here".
  isTrail = false,
  size,
  onClick,
  expanded,
  ...rest
}) {
  const TabIcon = tab.icon;
  const accented = isActive || isTrail;

  return (
    <button
      type="button"
      onClick={onClick}
      title={tab.title || tab.label}
      aria-label={tab.title || tab.label}
      aria-current={isActive ? "page" : undefined}
      aria-expanded={expanded}
      className={`relative w-full text-left pl-3.5 pr-3 py-2.5 rounded-xl transition-colors duration-150 flex items-start gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-1 ${
        isActive
          ? "bg-pine/[0.08] text-pine"
          : isTrail
            ? "bg-pine/[0.04] text-pine/80 hover:bg-pine/[0.07]"
            : "text-muted hover:bg-porcelain hover:text-ink"
      }`}
      {...rest}
    >
      {/* Left accent rail — the selected marker, so the row itself needs only a
          whisper of tint rather than a border fighting the panel's own. */}
      {accented && (
        <span
          aria-hidden="true"
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full ${
            isActive ? "bg-pine" : "bg-pine/35"
          }`}
        />
      )}
      {TabIcon && (
        <TabIcon
          className={`w-5 h-5 shrink-0 mt-px transition-colors ${
            accented ? "text-pine" : "text-muted group-hover:text-ink"
          }`}
        />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate ${size === "lg" ? "text-sm" : "text-xs"} font-mono font-semibold tracking-wide uppercase`}
        >
          {tab.label}
        </span>
        {tab.title && (
          <span
            className={`block text-xs mt-0.5 leading-snug font-sans font-light line-clamp-2 ${
              accented ? "text-pine/70" : "text-muted"
            }`}
          >
            {tab.title}
          </span>
        )}
      </span>
      {expanded !== undefined && (
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 shrink-0 mt-0.5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
            expanded ? "rotate-180" : ""
          } ${accented ? "text-pine/70" : "text-muted/50 group-hover:text-ink"}`}
        />
      )}
    </button>
  );
}

function SidebarSubItem({ tab, isActive, onClick }) {
  const TabIcon = tab.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={tab.title || tab.label}
      aria-label={tab.title || tab.label}
      aria-current={isActive ? "page" : undefined}
      className={`relative w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150 flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-1 ${
        isActive
          ? "bg-pine/10 text-pine"
          : "text-muted hover:bg-porcelain hover:text-ink"
      }`}
    >
      {/* Sits on top of the group's rail so the active sub-item is tied back to
          the parent it belongs to, rather than floating free of it. */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute -left-[13px] top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-pine"
        />
      )}
      {TabIcon && (
        <TabIcon
          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
            isActive ? "text-pine" : "text-muted/80 group-hover:text-ink"
          }`}
        />
      )}
      <span className="min-w-0 truncate font-mono text-sm font-semibold tracking-wide uppercase">
        {tab.label}
      </span>
    </button>
  );
}

function SidebarTabNav({ tabs, activeTab, onChange, ariaLabel, size }) {
  // Accordion: at most one group is open at a time, so opening Daily Activity
  // folds Dashboard away and the sidebar never grows past a screenful.
  const [openGroup, setOpenGroup] = useState(null);

  // Whenever navigation lands inside a group, that group becomes the open one —
  // so a deep link to e.g. ?tab=quizzes shows where it sits. Landing on a
  // top-level tab leaves the current group alone rather than folding it shut,
  // which would make the nav flicker on every unrelated click.
  useEffect(() => {
    const owning = tabs.find(
      (entry) =>
        hasChildren(entry) &&
        (entry.id === activeTab ||
          entry.children.some((child) => child.id === activeTab)),
    );
    if (!owning) return;
    setOpenGroup(groupKey(owning));
  }, [tabs, activeTab]);

  const toggleGroup = (key) =>
    setOpenGroup((prev) => (prev === key ? null : key));

  return (
    <nav
      aria-label={ariaLabel}
      className="rounded-2xl border border-line bg-paper p-2 shadow-soft flex flex-col gap-0.5"
    >
      {tabs.map((entry) => {
        // Hairline rule set by the data (not a hard-coded index), separating the
        // entries that own a dropdown from the plain ones below them.
        const divider = entry.dividerBefore ? (
          <div
            key={`${groupKey(entry)}-divider`}
            aria-hidden="true"
            className="my-1.5 mx-3 border-t border-line"
          />
        ) : null;

        if (!hasChildren(entry)) {
          return (
            <Fragment key={entry.id}>
              {divider}
              <SidebarRow
                tab={entry}
                size={size}
                isActive={activeTab === entry.id}
                onClick={() => onChange(entry.id)}
              />
            </Fragment>
          );
        }

        const key = groupKey(entry);
        const isOpen = openGroup === key;
        // Only a real tab can be "selected"; a label-only group (Daily
        // Activity) leaves the selected styling to whichever child is active.
        const isActive = Boolean(entry.id) && activeTab === entry.id;
        const holdsActiveChild = entry.children.some(
          (child) => child.id === activeTab,
        );
        const panelId = `tabnav-group-${key.replace(/\W+/g, "-").toLowerCase()}`;

        return (
          <Fragment key={key}>
            {divider}
            <div className="flex flex-col">
              <SidebarRow
                tab={entry}
                size={size}
                isActive={isActive}
                isTrail={!isActive && holdsActiveChild}
                expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  // A header that owns a tab navigates to it and reveals its
                  // children; clicking it again once it is already the active
                  // tab collapses the group without navigating away.
                  if (!entry.id) {
                    toggleGroup(key);
                    return;
                  }
                  if (isActive) {
                    toggleGroup(key);
                    return;
                  }
                  onChange(entry.id);
                  setOpenGroup(key);
                }}
              />

              {/* Collapsing via a 0fr/1fr grid row rather than unmounting, so
                  the panel animates shut as smoothly as it opens and the height
                  is taken from the content instead of a hard-coded max-height.
                  The middle layer transitions `visibility` so the sub-items stay
                  rendered for the length of the collapse and only then drop out
                  of the tab order and the a11y tree. */}
              <div
                id={panelId}
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div
                  className={`overflow-hidden transition-[visibility] duration-300 motion-reduce:transition-none ${
                    isOpen ? "visible" : "invisible"
                  }`}
                >
                  <div
                    className={`mt-1 mb-1 ml-[23px] pl-3 border-l border-line flex flex-col gap-0.5 transition duration-300 ease-out motion-reduce:transition-none ${
                      isOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-1"
                    }`}
                  >
                    {entry.children.map((child) => (
                      <SidebarSubItem
                        key={child.id}
                        tab={child}
                        isActive={activeTab === child.id}
                        onClick={() => onChange(child.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Fragment>
        );
      })}
    </nav>
  );
}

export default function TabNav({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Sections",
  variant = "bar",
  size = "base",
}) {
  if (variant === "sidebar") {
    return (
      <SidebarTabNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={onChange}
        ariaLabel={ariaLabel}
        size={size}
      />
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex border-b border-line overflow-x-auto whitespace-nowrap scrollbar-none gap-2 sm:gap-4 font-mono ${size === "lg" ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"} font-semibold tracking-wider uppercase text-muted`}
    >
      {tabs.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            title={tab.title || tab.label}
            aria-label={tab.title || tab.label}
            className={`shrink-0 pb-4 px-1 sm:px-3 flex items-center gap-2 border-b-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
              isActive
                ? "border-pine text-pine font-bold"
                : "border-transparent hover:text-ink"
            }`}
          >
            {TabIcon && <TabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
