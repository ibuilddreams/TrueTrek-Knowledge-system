"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Folder,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Lock,
  Route,
  Shield,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { ROUTES } from "@/constants/routes";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AccountMenu from "@/components/ui/AccountMenu";
import TabNav from "@/components/ui/TabNav";
import TabTransition from "@/components/ui/TabTransition";
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
import QuestionnaireTab from "@/components/features/admin/tabs/QuestionnaireTab";
import FutureClientsTab from "@/components/features/admin/tabs/FutureClientsTab";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "enrollments", label: "Enrollments", icon: ClipboardList },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "future-clients", label: "Future Clients", icon: UserPlus },
  { id: "teachers", label: "Teachers", icon: Users },
  { id: "progress", label: "Progress", icon: LineChart },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "categories", label: "Categories", icon: Folder },
  { id: "pathways", label: "Pathways", icon: Route },
  { id: "questionnaire", label: "Questionnaire", icon: HelpCircle },
];

const TAB_COMPONENTS = {
  dashboard: DashboardTab,
  stats: StatsTab,
  courses: CoursesTab,
  enrollments: EnrollmentsTab,
  students: StudentsTab,
  "future-clients": FutureClientsTab,
  teachers: TeachersTab,
  progress: ProgressTab,
  tags: TagsTab,
  categories: CategoriesTab,
  pathways: PathwaysTab,
  questionnaire: QuestionnaireTab,
};

const VALID_TABS = new Set(TABS.map((tab) => tab.id));
const DEFAULT_TAB = "dashboard";

function resolveTab(tabParam) {
  if (tabParam && VALID_TABS.has(tabParam)) return tabParam;
  return DEFAULT_TAB;
}

function AdminDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const { loadEnrollments } = useAdminEnrollments();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const activeTab = useMemo(
    () => resolveTab(searchParams.get("tab")),
    [searchParams]
  );

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (rawTab && !VALID_TABS.has(rawTab)) {
      router.replace(pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const setActiveTab = useCallback(
    (tabId) => {
      const nextTab = resolveTab(tabId);
      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === DEFAULT_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  if (!isAuthenticated || !isAdmin) {
    return (
      <AuthGateCard
        id="admin-gate-container"
        icon={Lock}
        title="Admin Access Required"
        subtitle="Sign in with an administrator account to view system-wide statistics and activity."
      >
        <button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
        >
          Go to Sign In
        </button>
      </AuthGateCard>
    );
  }

  const ActiveTabComponent = TAB_COMPONENTS[activeTab] || DashboardTab;

  return (
    <div
      id="admin-dashboard-container"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 font-sans"
    >
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 mb-8 border-b border-stone-200">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-[1.15rem] bg-amber-500/25 blur-md scale-110" />
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[1.15rem] bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 text-white flex items-center justify-center shadow-[0_10px_24px_-12px_rgba(180,83,9,0.7)] ring-2 ring-white">
              <Shield className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-stone-900 border-2 border-[#faf9f6] text-amber-400 flex items-center justify-center shadow-sm">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div className="min-w-0 pt-0.5">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="h-px w-4 bg-amber-500/70" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700/90">
                Admin Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-[2rem] font-serif font-bold tracking-tight text-stone-900 leading-none">
              Control Center
            </h1>
            <p className="text-[13px] text-stone-500 font-light mt-2 leading-snug max-w-md">
              Courses, enrollments, users, and platform health — in one place
              {user?.name ? ` · ${user.name}` : ""}.
            </p>
          </div>
        </div>

        <div className="relative z-40 flex items-center gap-3">
          <AccountMenu onProfile={() => router.push(ROUTES.PROFILE)} />
        </div>
      </div>

      <div className="mb-8">
        <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Admin sections" />
      </div>

      <TabTransition activeKey={activeTab}>
        <ActiveTabComponent />
      </TabTransition>

      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={() => loadEnrollments({ force: true })}
      />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<Loader label="Loading Dashboard..." />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
