import {
  Award,
  BookMarked,
  BookOpen,
  CircleHelp,
  ClipboardList,
  TrendingUp,
  Brain,
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
    id: "drill",
    label: "Daily Drill",
    icon: Brain,
    title: "Situational intelligence training drills",
  },
  {
    id: "warroom",
    label: "War Room",
    icon: Scale,
    title: "AI mastermind advisor console",
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
    id: "grades",
    label: "Grades",
    icon: TrendingUp,
    title: "Graded quiz and assignment results",
  },
  {
    id: "certificates",
    label: "Certificates",
    icon: Award,
    title: "Certificates from completed courses",
  },
];

export const VALID_PORTAL_TABS = new Set(PORTAL_TABS.map((tab) => tab.id));
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
