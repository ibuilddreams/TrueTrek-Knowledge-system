"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  GraduationCap,
  Plus,
  TrendingUp,
  BookMarked,
  Users,
  BookOpenCheck,
  FileText,
} from "lucide-react";
import { getDaysAgoDateString } from "@/lib/dates";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import AccountMenu from "@/components/ui/AccountMenu";
import Loader from "@/components/ui/Loader";
import TabNav from "@/components/ui/TabNav";
import TabTransition from "@/components/ui/TabTransition";
import TeacherEnrollStudentModal from "./TeacherEnrollStudentModal";
import DashboardTab from "./tabs/DashboardTab";
import MyCoursesTab from "./tabs/MyCoursesTab";
import EnrollmentScoresTab from "./tabs/EnrollmentScoresTab";
import InstructionalManualsTab from "./tabs/InstructionalManualsTab";
import CurriculumDocumentsTab from "./tabs/CurriculumDocumentsTab";

const INITIAL_STUDENTS = [
  {
    id: "stud-1",
    name: "Kyler Ross",
    category: "Athletic",
    institution: "University of Alabama",
    activeTierId: "tier-6",
    progressPercent: 82,
    averageScore: 94,
    streakDays: 14,
    completedDrillIds: ["drill-1", "drill-2"],
    enrollmentDate: "2026-01-10",
    avatarText: "KR",
    email: "k.ross@rolltide.edu",
    status: "Active",
    lastDrillDate: getDaysAgoDateString(1),
  },
  {
    id: "stud-2",
    name: "Elena Rostova",
    category: "Athletic",
    institution: "Stanford University",
    activeTierId: "tier-2",
    progressPercent: 65,
    averageScore: 88,
    streakDays: 8,
    completedDrillIds: ["drill-2"],
    enrollmentDate: "2026-02-15",
    avatarText: "ER",
    email: "elena.rostova@stanford.edu",
    status: "Active",
    lastDrillDate: getDaysAgoDateString(5),
  },
  {
    id: "stud-3",
    name: "Marcus Vance",
    category: "Academic",
    institution: "Metropolitan Prep Academy",
    activeTierId: "tier-4",
    progressPercent: 95,
    averageScore: 98,
    streakDays: 21,
    completedDrillIds: ["drill-1", "drill-3"],
    enrollmentDate: "2025-11-05",
    avatarText: "MV",
    email: "m_vance@metroprep.org",
    status: "Complete",
    lastDrillDate: getDaysAgoDateString(0),
  },
  {
    id: "stud-4",
    name: "Devon Vance",
    category: "Professional",
    institution: "Vance Ventures Tech",
    activeTierId: "tier-7",
    progressPercent: 40,
    averageScore: 78,
    streakDays: 4,
    completedDrillIds: ["drill-3"],
    enrollmentDate: "2026-03-01",
    avatarText: "DV",
    email: "devon@vanceventures.io",
    status: "Active",
    lastDrillDate: getDaysAgoDateString(7),
  },
  {
    id: "stud-5",
    name: "Sarah Jenkins",
    category: "Academic",
    institution: "Lakeside High School",
    activeTierId: "tier-1",
    progressPercent: 50,
    averageScore: 85,
    streakDays: 12,
    completedDrillIds: ["drill-2"],
    enrollmentDate: "2026-04-12",
    avatarText: "SJ",
    email: "sjenkins@lakesideacademy.net",
    status: "Active",
    lastDrillDate: getDaysAgoDateString(2),
  },
  {
    id: "stud-6",
    name: "Julian Chen",
    category: "Legacy",
    institution: "Toronto Global Prep",
    activeTierId: "tier-1c",
    progressPercent: 20,
    averageScore: 92,
    streakDays: 3,
    completedDrillIds: ["drill-1"],
    enrollmentDate: "2026-05-20",
    avatarText: "JC",
    email: "julian.chen@torontoglobal.ca",
    status: "Under Review",
    lastDrillDate: getDaysAgoDateString(6),
  },
];

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
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  const { isAuthenticated, role } = useAuth();
  const isFacultyLoggedIn = isAuthenticated && role === AUTH_ROLES.FACULTY;

  const activeTab = useMemo(
    () => resolveTeacherTab(searchParams.get("tab")),
    [searchParams],
  );

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
      ? { ...tab, label: `${tab.label} (${students.length})` }
      : tab,
  );

  const [isRegistering, setIsRegistering] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const handleOpenRegister = () => {
    setEditingStudent(null);
    setIsRegistering(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setIsRegistering(true);
  };

  const handleSaveStudent = (formData, savedEditingStudent) => {
    if (savedEditingStudent) {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === savedEditingStudent.id) {
            return {
              ...s,
              name: formData.name,
              email: formData.email,
              institution: formData.institution,
              category: formData.category,
              activeTierId: formData.activeTierId,
              progressPercent: Number(formData.progressPercent),
              averageScore: Number(formData.averageScore),
              streakDays: Number(formData.streakDays),
              status: formData.status,
              avatarText: formData.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2),
            };
          }
          return s;
        }),
      );
    } else {
      const newStudent = {
        id: `stud-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        institution: formData.institution,
        category: formData.category,
        activeTierId: formData.activeTierId,
        progressPercent: Number(formData.progressPercent),
        averageScore: Number(formData.averageScore),
        streakDays: Number(formData.streakDays),
        completedDrillIds: ["drill-1"],
        enrollmentDate: new Date().toISOString().split("T")[0],
        avatarText:
          formData.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2) || "ST",
        status: formData.status,
        lastDrillDate: getDaysAgoDateString(0),
      };
      setStudents((prev) => [...prev, newStudent]);
    }

    setIsRegistering(false);
    setEditingStudent(null);
  };

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
      {/* Header Block with high-end Display Typography */}
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

        {/* Actions bar for Portal */}
        <div className="mt-4 md:mt-0 flex gap-3">
          {/* <button
            onClick={handleOpenRegister}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            title="Add and configure a new scholar-athlete registration profile"
            aria-label="Add and configure a new scholar-athlete registration profile"
          >
            <Plus className="w-4 h-4" />
            ENROLL STUDENT
          </button> */}

          <AccountMenu onProfile={() => router.push(ROUTES.PROFILE)} />
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="mb-8">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Teacher sections"
        />
      </div>

      {/* RENDER ACTIVE TAB */}
      <TabTransition activeKey={activeTab}>
        {activeTab === "dashboard" && <DashboardTab students={students} />}
        {activeTab === "courses" && <MyCoursesTab />}
        {activeTab === "students" && (
          <EnrollmentScoresTab
            students={students}
            setStudents={setStudents}
            onEditStudent={handleOpenEdit}
          />
        )}
        {activeTab === "manuals" && <InstructionalManualsTab />}
        {activeTab === "documents" && <CurriculumDocumentsTab />}
      </TabTransition>

      <TeacherEnrollStudentModal
        isOpen={isRegistering}
        editingStudent={editingStudent}
        onClose={() => setIsRegistering(false)}
        onSubmit={handleSaveStudent}
      />
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
