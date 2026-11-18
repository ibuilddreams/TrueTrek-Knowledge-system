import {
  Award,
  BookMarked,
  Brain,
  BriefcaseBusiness,
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  Coins,
  Flag,
  Folder,
  Gift,
  GraduationCap,
  Headphones,
  HelpCircle,
  Inbox,
  Layers3,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Mail,
  MessageCircleQuestion,
  MessageSquareQuote,
  Mic,
  Route,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Tag,
  Theater,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  Video,
  BookOpen,
} from "lucide-react";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";

/**
 * The signed-in portal's navigation, for all three roles.
 *
 * Every entry is a real route (`/studentportal/courses`), not a tab in a
 * query string — the sidebar is a set of links, the browser's back button
 * works, and a page can be bookmarked or shared. The slug is also the id the
 * portal screens already use to pick a panel, so this file is the only place
 * the two have to agree.
 *
 * Groups and their order follow the design's own sidebar. Two deliberate
 * departures, both noted where they occur: the student has no "Favourites"
 * (the wishlist feature was removed), and the design's single "Daily
 * activity" entry is kept as the three screens this app actually has.
 */

/** The route each role's portal is rooted at. */
export const PORTAL_ROOT = {
  [AUTH_ROLES.STUDENT]: ROUTES.STUDENT_PORTAL,
  [AUTH_ROLES.FACULTY]: ROUTES.TEACHER_PORTAL,
  [AUTH_ROLES.ADMIN]: ROUTES.ADMIN_PORTAL,
};

/**
 * `badge` names a counter the shell resolves at render time (see
 * `PortalShell`'s `badges` prop) rather than a number baked in here, so this
 * stays a static config that any screen can import without pulling data in.
 */
const STUDENT_NAV = [
  {
    heading: "Learn",
    items: [
      { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
      { slug: "courses", label: "My courses", icon: BookMarked, title: "My courses" },
      { slug: "assignments", label: "Assignments", icon: ClipboardList, title: "Assignments", badge: "assignments" },
      { slug: "quizzes", label: "Quizzes", icon: CircleHelp, title: "Quizzes", badge: "quizzes" },
      { slug: "certificates", label: "Certificates", icon: Award, title: "Certificates" },
      { slug: "live-classes", label: "Live classes", icon: Video, title: "Live classes", badge: "live" },
    ],
  },
  {
    // The design has one "Daily activity" entry. This app ships the drill,
    // the quests and the course chat rooms as three separate screens, so they
    // are listed as three rather than hidden behind a page that does not
    // exist yet.
    heading: "Practice",
    items: [
      { slug: "drill", label: "Daily drill", icon: Brain, title: "Daily drill" },
      { slug: "quests", label: "Daily quests", icon: CalendarCheck, title: "Daily quests" },
      { slug: "warroom", label: "War room", icon: Scale, title: "War room" },
      { slug: "wargamer", label: "Tactical wargamer", icon: Theater, title: "Tactical wargamer" },
      { slug: "brand-validator", label: "Brand validator", icon: ShieldCheck, title: "Brand validator" },
      { slug: "warroom-live", label: "War room live", icon: Headphones, title: "War room live" },
    ],
  },
  {
    heading: "You",
    items: [
      { slug: "rewards", label: "Rewards", icon: Gift, title: "Rewards" },
      { slug: "advisor", label: "Ask an advisor", icon: MessageCircleQuestion, title: "Ask an advisor" },
      { slug: "messages", label: "Messages", icon: Mail, title: "Messages" },
    ],
  },
];

const TEACHER_NAV = [
  {
    heading: "Teach",
    items: [
      { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
      { slug: "courses", label: "My courses", icon: BookMarked, title: "My courses" },
      { slug: "students", label: "Students & scores", icon: Users, title: "Students & scores" },
      { slug: "progress", label: "Progress", icon: TrendingUp, title: "Progress" },
    ],
  },
  {
    heading: "Engage",
    items: [
      { slug: "classes", label: "Live classes", icon: Video, title: "Live classes" },
      { slug: "warroom", label: "War room", icon: Scale, title: "War room" },
      { slug: "advisor", label: "Ask an advisor", icon: MessageCircleQuestion, title: "Ask an advisor" },
      { slug: "concerns", label: "Student concerns", icon: Flag, title: "Student concerns" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { slug: "manuals", label: "Instructional manuals", icon: ListChecks, title: "Instructional manuals" },
      { slug: "documents", label: "Curriculum documents", icon: Folder, title: "Curriculum documents" },
      { slug: "requests", label: "Requests", icon: Inbox, title: "Requests" },
      { slug: "profile", label: "Public profile", icon: UserRound, title: "Public profile" },
    ],
  },
];

const ADMIN_NAV = [
  {
    heading: "Overview",
    items: [{ slug: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard" }],
  },
  {
    heading: "People",
    items: [
      { slug: "students", label: "Students", icon: GraduationCap, title: "Students" },
      { slug: "teachers", label: "Teachers", icon: Users, title: "Teachers" },
      { slug: "teacher-applications", label: "Teacher applications", icon: BriefcaseBusiness, title: "Teacher applications" },
      { slug: "invitations", label: "Invitations", icon: UserPlus, title: "Invitations" },
    ],
  },
  {
    heading: "Learning",
    items: [
      { slug: "courses", label: "Courses", icon: BookOpen, title: "Courses" },
      { slug: "enrollments", label: "Enrollments", icon: Layers3, title: "Enrollments" },
      { slug: "progress", label: "Progress", icon: LineChart, title: "Progress" },
      { slug: "pathways", label: "Pathways", icon: Route, title: "Pathways" },
      { slug: "tiers", label: "Tiers", icon: Layers3, title: "Tiers" },
      { slug: "categories", label: "Categories", icon: Folder, title: "Categories" },
      { slug: "tags", label: "Tags", icon: Tag, title: "Tags" },
    ],
  },
  {
    heading: "Engagement",
    items: [
      { slug: "daily-drills", label: "Daily drills", icon: CalendarCheck, title: "Daily drills" },
      { slug: "quests", label: "Daily quests", icon: Swords, title: "Daily quests" },
      { slug: "wargamer", label: "Tactical wargamer", icon: Theater, title: "Tactical wargamer" },
      { slug: "live-sessions", label: "War room live", icon: Mic, title: "War room live" },
      { slug: "questionnaire", label: "Onboarding questions", icon: HelpCircle, title: "Onboarding questions" },
    ],
  },
  {
    heading: "Rewards",
    items: [
      { slug: "rewards", label: "Rewards catalog", icon: Gift, title: "Rewards catalog" },
      { slug: "redemptions", label: "Redemptions", icon: Coins, title: "Redemptions" },
      { slug: "student-points", label: "Student points", icon: Coins, title: "Student points" },
    ],
  },
  {
    heading: "Support",
    items: [
      { slug: "teacher-requests", label: "Teacher requests", icon: Inbox, title: "Teacher requests" },
      { slug: "student-concerns", label: "Student concerns", icon: ShieldAlert, title: "Student concerns" },
      { slug: "testimonials", label: "Testimonials", icon: MessageSquareQuote, title: "Testimonials" },
    ],
  },
];

export const PORTAL_NAV_BY_ROLE = {
  [AUTH_ROLES.STUDENT]: STUDENT_NAV,
  [AUTH_ROLES.FACULTY]: TEACHER_NAV,
  [AUTH_ROLES.ADMIN]: ADMIN_NAV,
};

/** Every slug a role's sidebar can reach, in sidebar order. */
export function portalSlugs(role) {
  return (PORTAL_NAV_BY_ROLE[role] ?? []).flatMap((group) =>
    group.items.map((item) => item.slug),
  );
}

/**
 * Screens reachable by URL but not listed in the sidebar — the student's
 * streak page is opened from the header's streak chip, and the portal must
 * still treat `/studentportal/streak` as a real page rather than redirecting
 * it to the dashboard.
 */
export const HIDDEN_PORTAL_SLUGS = {
  [AUTH_ROLES.STUDENT]: ["streak"],
};

export function isValidPortalSlug(role, slug) {
  return (
    portalSlugs(role).includes(slug) ||
    (HIDDEN_PORTAL_SLUGS[role] ?? []).includes(slug)
  );
}

/** The heading shown in the top bar for a slug. */
export function portalTitle(role, slug) {
  for (const group of PORTAL_NAV_BY_ROLE[role] ?? []) {
    const match = group.items.find((item) => item.slug === slug);
    if (match) return match.title ?? match.label;
  }
  return "Dashboard";
}

/** `/studentportal/courses` — the root alone for the default screen. */
export function portalHref(role, slug) {
  const root = PORTAL_ROOT[role];
  if (!root) return ROUTES.PORTAL;
  return slug && slug !== "dashboard" ? `${root}/${slug}` : root;
}

export const DEFAULT_PORTAL_SLUG = "dashboard";
