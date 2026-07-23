"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Lock,
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
import EnrollStudentModal from "@/components/features/admin/EnrollStudentModal";
import DashboardTab from "@/components/features/admin/tabs/DashboardTab";
import StatsTab from "@/components/features/admin/tabs/StatsTab";
import CoursesTab from "@/components/features/admin/tabs/CoursesTab";
import EnrollmentsTab from "@/components/features/admin/tabs/EnrollmentsTab";
import StudentsTab from "@/components/features/admin/tabs/StudentsTab";
import TeachersTab from "@/components/features/admin/tabs/TeachersTab";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  // { id: "stats", label: "Stats", icon: BarChart3 },
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
  const { isAdmin, isAuthenticated } = useAuth();
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
    <div id="admin-dashboard-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Admin Control Center</h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            System-wide statistics, analytics, and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AccountMenu onProfile={() => router.push(ROUTES.PROFILE)} />
        </div>
      </div>

      <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

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
