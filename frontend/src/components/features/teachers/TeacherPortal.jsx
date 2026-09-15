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
  FileWarning,
  LineChart,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherEnrolledStudents } from "@/hooks/useTeacherEnrolledStudents";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import AccountMenu from "@/components/ui/AccountMenu";
import Loader from "@/components/ui/Loader";
import TabNav from "@/components/ui/TabNav";
import TabTransition from "@/components/ui/TabTransition";
import WarRoomScreen from "@/components/features/warroom/WarRoomScreen";
import DashboardTab from "./tabs/DashboardTab";
import MyCoursesTab from "./tabs/MyCoursesTab";
import EnrollmentScoresTab from "./tabs/EnrollmentScoresTab";
import ProgressTab from "./tabs/ProgressTab";
import InstructionalManualsTab from "./tabs/InstructionalManualsTab";
import CurriculumDocumentsTab from "./tabs/CurriculumDocumentsTab";
import RequestsTab from "./tabs/RequestsTab";
import StudentConcernsTab from "./tabs/StudentConcernsTab";

const TEACHER_TABS = [
  {
    id: "dashboard",
    label: "Analytics Dashboard",
    icon: TrendingUp,
    title: "Switch tab to Faculty Analytics Dashboard",
  },
  {
    id: "requests",
    label: "Requests",
    icon: FileWarning,
    title: "Request a Change / Report an Error",
  },
  {
    id: "concerns",
    label: "Student Concerns",
    icon: ShieldAlert,
    title: "Concerns you've flagged about a student",
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
    id: "warroom",
    label: "War Room",
    icon: Scale,
    title: "Course group chat with your students",
  },
  {
    id: "progress",
    label: "Progress",
    icon: LineChart,
    title: "Switch tab to Student Progress — lessons, assignments, and quizzes",
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
  const {
    items: students,
    total: studentsTotal,
    loadEnrolledStudents,
  } = useTeacherEnrolledStudents();

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
        <div className="w-full max-w-md bg-paper border border-line rounded-2xl shadow-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-ink mb-1.5">
            Faculty Access Required
          </h2>
          <p className="text-sm text-muted font-light mb-6">
            Sign in with a teacher account to open the Faculty Suite.
          </p>
          <button
            type="button"
            onClick={() => router.push(ROUTES.LOGIN)}
            className="w-full py-3.5 bg-pine hover:bg-moss text-paper font-bold font-mono text-sm uppercase tracking-wider rounded-xl shadow-md transition"
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
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 mb-8 border-b border-line">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-[1.15rem] bg-gold/25 blur-md scale-110" />
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[1.15rem] bg-gradient-to-br from-pine via-moss to-gold text-paper flex items-center justify-center shadow-[0_10px_24px_-12px_rgba(9,45,41,0.7)] ring-2 ring-paper">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-ink border-2 border-paper text-gold flex items-center justify-center shadow-sm">
              <BookMarked className="w-3 h-3" />
            </div>
          </div>

          <div className="min-w-0 pt-0.5">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="h-px w-4 bg-gold/70" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gold">
                Faculty Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-[2rem] font-serif font-bold tracking-tight text-ink leading-none">
              Teacher & Faculty Suite
            </h1>
            <p className="text-base text-muted font-light mt-2 leading-snug max-w-md">
              Courses, students, scores, manuals, and enrollment — in one place.
            </p>
          </div>
        </div>

        <div className="relative z-40 flex items-center gap-3">
          <AccountMenu
            onProfile={() => router.push(ROUTES.PROFILE)}
            onMessages={() => router.push(ROUTES.MESSAGES)}
            size="lg"
          />
        </div>
      </div>

      <div className="mb-8">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Teacher sections"
          size="lg"
        />
      </div>

      <TabTransition activeKey={activeTab}>
        {activeTab === "dashboard" && <DashboardTab students={students} />}
        {activeTab === "courses" && <MyCoursesTab />}
        {activeTab === "students" && <EnrollmentScoresTab />}
        {activeTab === "warroom" && <WarRoomScreen />}
        {activeTab === "progress" && <ProgressTab />}
        {activeTab === "manuals" && <InstructionalManualsTab />}
        {activeTab === "documents" && <CurriculumDocumentsTab />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "concerns" && <StudentConcernsTab />}
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
