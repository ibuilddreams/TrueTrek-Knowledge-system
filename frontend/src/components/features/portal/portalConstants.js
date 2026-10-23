import {
  Award,
  BookMarked,
  BookOpen,
  Brain,
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  Gift,
  Headphones,
  MessageCircleQuestion,
  Scale,
  ShieldCheck,
  Swords,
  Theater,
} from "lucide-react";

// The sidebar is a two-level nav: a few entries own a collapsible group of
// sub-tabs (`children`). A group header is itself a tab when it has an `id`
// that `StudentPortal` renders a panel for (Dashboard), and a label-only
// section otherwise (Daily Activity) — `TabNav`'s sidebar variant branches on
// exactly that. Keep every leaf id in sync with the `activeTab ===` branches
// in `StudentPortal.jsx`; `PORTAL_TABS` below flattens this tree, so routing
// and `VALID_PORTAL_TABS` pick new leaves up automatically.
export const PORTAL_NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BookOpen,
    title: "Student learning overview",
    children: [
      {
        id: "courses",
        label: "My Courses",
        icon: BookMarked,
        title: "Enrolled courses and learning progress",
      },
      {
        id: "assignments",
        label: "My Assignments",
        icon: ClipboardList,
        title: "Course assignments and submissions",
      },
      {
        id: "quizzes",
        label: "My Quizzes",
        icon: CircleHelp,
        title: "Available quizzes and attempts",
      },
    ],
  },
  {
    label: "Daily Activity",
    icon: CalendarCheck,
    title: "Drills, quests and team chat",
    children: [
      {
        id: "drill",
        label: "Daily Drill",
        icon: Brain,
        title: "Situational intelligence training drills",
      },
      {
        id: "quests",
        label: "Daily Quests",
        icon: Swords,
        title: "Daily real-world brand-building tasks",
      },
      {
        id: "warroom",
        label: "War Room",
        icon: Scale,
        title: "Course group chat with your instructor and classmates",
      },
    ],
  },
  {
    id: "certificates",
    // Hairline rule above this row — everything from here down is a plain tab,
    // everything above it owns a dropdown. `TabNav` reads the flag so the rule
    // follows the data instead of a hard-coded position.
    dividerBefore: true,
    label: "Certificates",
    icon: Award,
    title: "Certificates from completed courses",
  },
  {
    id: "wargamer",
    label: "Tactical Wargamer",
    icon: Theater,
    title: "AI role-play practice for saying no without burning bridges",
  },
  {
    id: "brand-validator",
    label: "Brand Validator",
    icon: ShieldCheck,
    title: "AI critique of your sponsorship media kit",
  },
  {
    id: "warroom-live",
    label: "War Room Live",
    icon: Headphones,
    title: "Live audio sessions with college athletes",
  },
  {
    id: "rewards",
    label: "Rewards",
    icon: Gift,
    title: "Points balance, transaction history, and rewards catalog",
  },
  {
    id: "advisor",
    label: "Ask an Advisor",
    icon: MessageCircleQuestion,
    title: "Chat privately with an advisor",
  },
];

// Flattened leaves — every nav entry that maps to a panel, in sidebar order.
// A group header without an `id` (Daily Activity) is a label, not a tab, so it
// contributes only its children.
export const PORTAL_TABS = PORTAL_NAV.flatMap((entry) => [
  ...(entry.id ? [{ ...entry, children: undefined }] : []),
  ...(entry.children ?? []),
]);

// Task 16 (Phase 5) follow-up — the Streak page is reached only via the
// header's Streak stat chip (PortalHeader.jsx), not the sidebar nav, so it's
// a valid tab for URL/routing purposes (`resolvePortalTab` below) without
// being listed in PORTAL_TABS.
export const HIDDEN_PORTAL_TAB_IDS = ["streak"];

export const VALID_PORTAL_TABS = new Set([
  ...PORTAL_TABS.map((tab) => tab.id),
  ...HIDDEN_PORTAL_TAB_IDS,
]);
export const DEFAULT_PORTAL_TAB = "dashboard";

export function getInitials(name) {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "ST";
}

export function resolvePortalTab(tabParam) {
  if (tabParam && VALID_PORTAL_TABS.has(tabParam)) return tabParam;
  return DEFAULT_PORTAL_TAB;
}
