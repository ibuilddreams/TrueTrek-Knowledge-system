import {
  Award,
  BookMarked,
  BookOpen,
  Brain,
  CircleHelp,
  ClipboardList,
  Gift,
  Scale,
} from "lucide-react";

export const PORTAL_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BookOpen,
    title: "Student learning overview",
  },
  {
    id: "courses",
    label: "My Courses",
    icon: BookMarked,
    title: "Enrolled courses and learning progress",
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: ClipboardList,
    title: "Course assignments and submissions",
  },
  {
    id: "quizzes",
    label: "Quizzes",
    icon: CircleHelp,
    title: "Available quizzes and attempts",
  },
  {
    id: "certificates",
    label: "Certificates",
    icon: Award,
    title: "Certificates from completed courses",
  },
  {
    id: "drill",
    label: "Daily Drill",
    icon: Brain,
    title: "Situational intelligence training drills",
  },
  {
    id: "rewards",
    label: "Rewards",
    icon: Gift,
    title: "Points balance, transaction history, and rewards catalog",
  },
  {
    id: "warroom",
    label: "War Room",
    icon: Scale,
    title: "AI mastermind advisor console",
  },
];

export const VALID_PORTAL_TABS = new Set(PORTAL_TABS.map((tab) => tab.id));
export const DEFAULT_PORTAL_TAB = "dashboard";

export const WAR_ROOM_PRESETS = [
  "A wealthy booster offered $25,000 to fund my podcast but demands licensing royalties on all adjacent merchandise designs.",
  "D1 coaching staff is demanding I skip organic recovery days to run scout exhibitions, triggering muscle fatigue alerts.",
  'A regional venture group wants me to license my trademark "MJ-Prime" for 10 years for $10k cash upfront.',
];

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
