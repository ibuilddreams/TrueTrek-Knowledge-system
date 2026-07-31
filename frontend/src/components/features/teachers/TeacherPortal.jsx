"use client";

import { useEffect, useMemo, useCallback, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  GraduationCap,
  TrendingUp,
  BookMarked,
  Users,
  BookOpenCheck,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherEnrolledStudents } from "@/hooks/useTeacherEnrolledStudents";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import AccountMenu from "@/components/ui/AccountMenu";
import Loader from "@/components/ui/Loader";
import TabNav from "@/components/ui/TabNav";
import TabTransition from "@/components/ui/TabTransition";
import DashboardTab from "./tabs/DashboardTab";
import MyCoursesTab from "./tabs/MyCoursesTab";
import EnrollmentScoresTab from "./tabs/EnrollmentScoresTab";
import InstructionalManualsTab from "./tabs/InstructionalManualsTab";
import CurriculumDocumentsTab from "./tabs/CurriculumDocumentsTab";

const TEACHER_TABS = [
  {
    id: "dashboard",
    label: "Analytics Dashboard",
    icon: TrendingUp,
    title: "Switch tab to Faculty Analytics Dashboard",
  },
  {
    id: "courses",
    label: "My Courses",
    icon: BookMarked,
    title: "Switch tab to My Assigned Courses",
  },
  {
    id: "students",
    label: "Enrollment & Scores",
    icon: Users,
    title:
      "Switch tab to Scholar-Athlete Enrollment Slots and Compliance Scores",
  },
  {
    id: "manuals",
    label: "Instructional Manuals",
    icon: BookOpenCheck,
    title: "Switch tab to Curriculum Instruction Manuals",
  },
  {
    id: "documents",
    label: "Curriculum Documents",
    icon: FileText,
    title: "Switch tab to Curriculum PDF Resources and Guides",
  },
];

const VALID_TEACHER_TABS = new Set(TEACHER_TABS.map((tab) => tab.id));
const DEFAULT_TEACHER_TAB = "dashboard";

function resolveTeacherTab(tabParam) {
  if (tabParam && VALID_TEACHER_TABS.has(tabParam)) return tabParam;
  return DEFAULT_TEACHER_TAB;
}

function TeacherPortalContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items: students, total: studentsTotal, loadEnrolledStudents } =
    useTeacherEnrolledStudents();

  const { isAuthenticated, role } = useAuth();
  const isFacultyLoggedIn = isAuthenticated && role === AUTH_ROLES.FACULTY;

  const activeTab = useMemo(
    () => resolveTeacherTab(searchParams.get("tab")),
    [searchParams],
  );

  useEffect(() => {
    if (isFacultyLoggedIn) {
      loadEnrolledStudents();
    }
  }, [isFacultyLoggedIn, loadEnrolledStudents]);

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (rawTab && !VALID_TEACHER_TABS.has(rawTab)) {
      router.replace(pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const setActiveTab = useCallback(
    (tabId) => {
      const nextTab = resolveTeacherTab(tabId);
      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === DEFAULT_TEACHER_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const tabs = TEACHER_TABS.map((tab) =>
    tab.id === "students"
      ? { ...tab, label: `${tab.label} (${studentsTotal || students.length})` }
      : tab,
  );

  if (!isFacultyLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1.5">
            Faculty Access Required
          </h2>
          <p className="text-xs text-stone-500 font-light mb-6">
            Sign in with a teacher account to open the Faculty Suite.
          </p>
          <button
            type="button"
            onClick={() => router.push(ROUTES.LOGIN)}
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="teacher-portal-view"
      className="py-10 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto min-h-[85vh] font-sans"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-10 border-b border-stone-200">
        <div>
          <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-bold block mb-1">
            Administrative Terminal
          </span>
          <h1 className="text-3xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-amber-700" />
            Teacher & Faculty Suite
          </h1>
          <p className="text-sm text-stone-500 font-light mt-0.5">
            Review student progress analytics, adjust test scores, administer
            curriculum manuals, and manage cohort enrollment slots.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-3">
          <AccountMenu onProfile={() => router.push(ROUTES.PROFILE)} />
        </div>
      </div>

      <div className="mb-8">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Teacher sections"
        />
      </div>

      <TabTransition activeKey={activeTab}>
        {activeTab === "dashboard" && <DashboardTab students={students} />}
        {activeTab === "courses" && <MyCoursesTab />}
        {activeTab === "students" && <EnrollmentScoresTab />}
        {activeTab === "manuals" && <InstructionalManualsTab />}
        {activeTab === "documents" && <CurriculumDocumentsTab />}
      </TabTransition>
    </div>
  );
}

export default function TeacherPortal() {
  return (
    <Suspense fallback={<Loader label="Loading Teacher Portal..." />}>
      <TeacherPortalContent />
    </Suspense>
  );
}
