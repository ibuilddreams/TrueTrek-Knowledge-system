"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  Coins,
  FileWarning,
  Folder,
  Gift,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Layers3,
  LineChart,
  Lock,
  MessageSquareQuote,
  Route,
  Mic,
  Shield,
  ShieldAlert,
  Swords,
  Tag,
  UserCheck,
  Theater,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { ROUTES } from "@/constants/routes";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AccountMenu from "@/components/ui/AccountMenu";
import NotificationBell from "@/components/ui/NotificationBell";
import TabTransition from "@/components/ui/TabTransition";
import { AUTH_ROLES } from "@/constants/auth";
import PortalShell from "@/components/features/portal/shell/PortalShell";
import {
  DEFAULT_PORTAL_SLUG,
  isValidPortalSlug,
  portalHref,
} from "@/components/features/portal/shell/portalNav";
import Loader from "@/components/ui/Loader";
import EnrollStudentModal from "@/components/features/admin/EnrollStudentModal";
import DashboardTab from "@/components/features/admin/tabs/DashboardTab";
import StatsTab from "@/components/features/admin/tabs/StatsTab";
import CoursesTab from "@/components/features/admin/tabs/CoursesTab";
import EnrollmentsTab from "@/components/features/admin/tabs/EnrollmentsTab";
import StudentsTab from "@/components/features/admin/tabs/StudentsTab";
import TeachersTab from "@/components/features/admin/tabs/TeachersTab";
import ProgressTab from "@/components/features/admin/tabs/ProgressTab";
import TagsTab from "@/components/features/admin/tabs/TagsTab";
import CategoriesTab from "@/components/features/admin/tabs/CategoriesTab";
import PathwaysTab from "@/components/features/admin/tabs/PathwaysTab";
import TiersTab from "@/components/features/admin/tabs/TiersTab";
import QuestionnaireTab from "@/components/features/admin/tabs/QuestionnaireTab";
import TeacherRequestsTab from "@/components/features/admin/tabs/TeacherRequestsTab";
import TeacherOnboardingTab from "@/components/features/admin/tabs/TeacherOnboardingTab";
import StudentConcernsTab from "@/components/features/admin/tabs/StudentConcernsTab";
import RewardsTab from "@/components/features/admin/tabs/RewardsTab";
import RedemptionsTab from "@/components/features/admin/tabs/RedemptionsTab";
import StudentPointsTab from "@/components/features/admin/tabs/StudentPointsTab";
import DailyDrillsTab from "@/components/features/admin/tabs/DailyDrillsTab";
import QuestsTab from "@/components/features/admin/tabs/QuestsTab";
import WargamerTab from "@/components/features/admin/tabs/WargamerTab";
import LiveSessionsTab from "@/components/features/admin/tabs/LiveSessionsTab";
import InvitationsTab from "@/components/features/admin/tabs/InvitationsTab";
import TestimonialsTab from "@/components/features/admin/tabs/TestimonialsTab";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "enrollments", label: "Enrollments", icon: ClipboardList },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "teachers", label: "Teachers", icon: Users },
  { id: "teacher-applications", label: "Teacher Applications", icon: UserCheck },
  { id: "invitations", label: "Invitations", icon: UserPlus },
  { id: "teacher-requests", label: "Teacher Requests", icon: FileWarning },
  { id: "student-concerns", label: "Student Concerns", icon: ShieldAlert },
  { id: "progress", label: "Progress", icon: LineChart },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "categories", label: "Categories", icon: Folder },
  { id: "tiers", label: "Tiers", icon: Layers3 },
  { id: "pathways", label: "Pathways", icon: Route },
  { id: "questionnaire", label: "Questionnaire", icon: HelpCircle },
  { id: "daily-drills", label: "Daily Drills", icon: Calendar },
  { id: "quests", label: "Daily Quests", icon: Swords },
  { id: "wargamer", label: "Tactical Wargamer", icon: Theater },
  { id: "live-sessions", label: "War Room Live", icon: Mic },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "redemptions", label: "Redemptions", icon: ClipboardList },
  { id: "student-points", label: "Student Points", icon: Coins },
];

const TAB_COMPONENTS = {
  invitations: InvitationsTab,
  dashboard: DashboardTab,
  stats: StatsTab,
  courses: CoursesTab,
  enrollments: EnrollmentsTab,
  students: StudentsTab,
  testimonials: TestimonialsTab,
  teachers: TeachersTab,
  "teacher-applications": TeacherOnboardingTab,
  "teacher-requests": TeacherRequestsTab,
  "student-concerns": StudentConcernsTab,
  progress: ProgressTab,
  tags: TagsTab,
  categories: CategoriesTab,
  tiers: TiersTab,
  pathways: PathwaysTab,
  questionnaire: QuestionnaireTab,
  "daily-drills": DailyDrillsTab,
  quests: QuestsTab,
  wargamer: WargamerTab,
  "live-sessions": LiveSessionsTab,
  rewards: RewardsTab,
  redemptions: RedemptionsTab,
  "student-points": StudentPointsTab,
};

const VALID_TABS = new Set(TABS.map((tab) => tab.id));
const DEFAULT_TAB = "dashboard";

function resolveTab(tabParam) {
  if (tabParam && VALID_TABS.has(tabParam)) return tabParam;
  return DEFAULT_TAB;
}

const DETAIL_PARAMS = ["progressCourseId", "concern", "application"];

const NOTIFICATION_DESTINATIONS = {
  student_concern: { tab: "student-concerns", param: "concern" },
  teacher_onboarding: { tab: "teacher-applications", param: "application" },
};

function AdminDashboardContent({ slug = DEFAULT_PORTAL_SLUG }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const { loadEnrollments } = useAdminEnrollments();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const activeTab = isValidPortalSlug(AUTH_ROLES.ADMIN, slug)
    ? slug
    : DEFAULT_PORTAL_SLUG;

  // Back-compatibility with the portal's previous `?tab=` URLs — a bookmark
  // or an old link lands on the matching route rather than the dashboard.
  useEffect(() => {
    const legacyTab = searchParams.get("tab");
    if (!legacyTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const target = isValidPortalSlug(AUTH_ROLES.ADMIN, legacyTab)
      ? legacyTab
      : DEFAULT_PORTAL_SLUG;
    const query = params.toString();
    const href = portalHref(AUTH_ROLES.ADMIN, target);
    router.replace(query ? `${href}?${query}` : href, { scroll: false });
  }, [router, searchParams]);

  // Which tab a notification opens, and which query param carries the row it
  // points at. Keyed on `related_object_type`, which every producer sets (see
  // notifications/services.py) — before this existed every notification
  // landed on Student Concerns, which was right only because that was the
  // only producer.
  const handleSelectNotification = useCallback(
    (notification) => {
      const destination = NOTIFICATION_DESTINATIONS[notification.related_object_type];
      if (!destination) return;

      const params = new URLSearchParams();
      if (notification.related_object_id) {
        params.set(destination.param, String(notification.related_object_id));
      }
      const href = portalHref(AUTH_ROLES.ADMIN, destination.tab);
      const query = params.toString();
      router.push(query ? `${href}?${query}` : href);
    },
    [router]
  );

  if (!isAuthenticated || !isAdmin) {
    return (
      <AuthGateCard
        id="admin-gate-container"
        icon={Lock}
        title="Admin Access Required"
        subtitle="Sign in with an administrator account to view system-wide statistics and activity."
        size="lg"
      >
        <button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full py-3.5 bg-pine hover:bg-moss text-paper font-medium font-sans text-xs uppercase tracking-widest rounded-full shadow-md transition"
        >
          Go to Sign In
        </button>
      </AuthGateCard>
    );
  }

  const ActiveTabComponent = TAB_COMPONENTS[activeTab] || DashboardTab;

  return (
    <PortalShell
      role={AUTH_ROLES.ADMIN}
      activeSlug={activeTab}
      user={{ name: user?.name }}
      today={new Date()}
      onOpenNotifications={undefined}
    >
      <TabTransition activeKey={activeTab}>
        <ActiveTabComponent />
      </TabTransition>

      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={() => loadEnrollments({ force: true })}
      />
    </PortalShell>
  );
}

export default function AdminDashboard({ slug }) {
  return (
    <Suspense fallback={<Loader label="Loading Dashboard..." />}>
      <AdminDashboardContent slug={slug} />
    </Suspense>
  );
}
