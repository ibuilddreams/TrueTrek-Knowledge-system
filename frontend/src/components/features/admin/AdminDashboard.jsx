"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminEnrollments } from "@/hooks/admin/useAdminEnrollments";
import { ROUTES } from "@/constants/routes";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AccountMenu from "@/components/ui/AccountMenu";
import TabNav from "@/components/ui/TabNav";
import TabTransition from "@/components/ui/TabTransition";
import EnrollStudentModal from "@/components/features/admin/EnrollStudentModal";
import DashboardTab from "@/components/features/admin/tabs/DashboardTab";
import StatsTab from "@/components/features/admin/tabs/StatsTab";
import CoursesTab from "@/components/features/admin/tabs/CoursesTab";
import EnrollmentsTab from "@/components/features/admin/tabs/EnrollmentsTab";
import StudentsTab from "@/components/features/admin/tabs/StudentsTab";
import TeachersTab from "@/components/features/admin/tabs/TeachersTab";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "enrollments", label: "Enrollments", icon: ClipboardList },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "teachers", label: "Teachers", icon: Users },
];

const TAB_COMPONENTS = {
  dashboard: DashboardTab,
  stats: StatsTab,
  courses: CoursesTab,
  enrollments: EnrollmentsTab,
  students: StudentsTab,
  teachers: TeachersTab,
};

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const { loadEnrollments } = useAdminEnrollments();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

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

  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div
      id="admin-dashboard-container"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 font-sans"
    >
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm mb-8">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900" />
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />
        <div className="relative p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center shadow-md shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                Administration
              </p>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Control Center
              </h1>
              <p className="text-xs text-stone-500 font-light mt-1.5 max-w-xl leading-relaxed">
                Monitor platform health, manage courses and enrollments, and keep
                learner progress under audit
                {user?.name ? ` — signed in as ${user.name}` : ""}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AccountMenu onProfile={() => router.push(ROUTES.PROFILE)} />
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-stone-200/90 bg-white/80 px-2 pt-2 shadow-sm">
        <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
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
