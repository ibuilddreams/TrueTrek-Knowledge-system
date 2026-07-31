import {
  Award,
  BookMarked,
  BookOpen,
  Brain,
  CircleHelp,
  ClipboardList,
  Scale,
  TrendingUp,
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
    id: "achievements",
    label: "Progress",
    icon: Award,
    title: "Scholar accomplishments, XP, and badges",
  },
];

export const VALID_PORTAL_TABS = new Set(PORTAL_TABS.map((tab) => tab.id));
export const DEFAULT_PORTAL_TAB = "dashboard";

export const WAR_ROOM_PRESETS = [
  "A wealthy booster offered $25,000 to fund my podcast but demands licensing royalties on all adjacent merchandise designs.",
  "D1 coaching staff is demanding I skip organic recovery days to run scout exhibitions, triggering muscle fatigue alerts.",
  'A regional venture group wants me to license my trademark "MJ-Prime" for 10 years for $10k cash upfront.',
];

export function buildPortalBadges({
  isLoggedIn,
  drillCompletedList,
  aggregateScore,
  consultationCount,
  streakDays,
  completedModules,
}) {
  return [
    {
      id: "recruit",
      title: "Fresh Recruit",
      desc: "Access granted to the Elite Mastermind Portal.",
      criteria: "Log in to the Student Portal",
      icon: "UserCheck",
      isUnlocked: isLoggedIn,
    },
    {
      id: "first-drill",
      title: "Strategic Pulse",
      desc: "Completed your first high-stakes situational drill.",
      criteria: "Solve 1 situational drill",
      icon: "Brain",
      isUnlocked: drillCompletedList.length >= 1,
    },
    {
      id: "perfect-drill",
      title: "Tactical Maverick",
      desc: "Achieved a perfect score of 100/100 on a situational drill.",
      criteria: "Score 100 points in any drill",
      icon: "Zap",
      isUnlocked: aggregateScore === 100 && drillCompletedList.length >= 1,
    },
    {
      id: "governance-master",
      title: "Grand Tactician",
      desc: "Completed all compliance drills inside the situational portfolio.",
      criteria: "Solve all 3 core drills",
      icon: "Trophy",
      isUnlocked: drillCompletedList.length === 3,
    },
    {
      id: "advisor-consult",
      title: "Council Protégé",
      desc: "Sought strategic feedback from the elite Advisor Council.",
      criteria: "Run 1 consultant query in War Room",
      icon: "Scale",
      isUnlocked: consultationCount >= 1,
    },
    {
      id: "streak-champ",
      title: "Relentless Scholar",
      desc: "Maintained a persistent streak in situational drills.",
      criteria: "Reach a daily streak of 7+ days",
      icon: "Flame",
      isUnlocked: streakDays >= 7,
    },
    {
      id: "ivy-scholar",
      title: "Academy Laureate",
      desc: "Audited and certified multiple modules in the 11-Tier program.",
      criteria: "Certify 3 or more Educational Tiers",
      icon: "BookOpen",
      isUnlocked: completedModules.length >= 3,
    },
    {
      id: "legacy-guardian",
      title: "Sovereign Steward",
      desc: "Completed Tier 9 (Legacy & Wealth Preservation) curriculum.",
      criteria: "Certify Tier 9 module",
      icon: "Crown",
      isUnlocked: completedModules.includes("tier-9"),
    },
  ];
}

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
