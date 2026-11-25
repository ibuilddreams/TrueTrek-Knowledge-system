"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  TrendingUp,
  Users,
  BookOpenCheck,
  FileWarning,
  LineChart,
  MessageCircleQuestion,
  Scale,
  ShieldAlert,
  UserRound,
  Video,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherEnrolledStudents } from "@/hooks/useTeacherEnrolledStudents";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import Loader from "@/components/ui/Loader";
import TabTransition from "@/components/ui/TabTransition";
import PortalShell from "@/components/features/portal/shell/PortalShell";
import {
  DEFAULT_PORTAL_SLUG,
  isValidPortalSlug,
  portalHref,
} from "@/components/features/portal/shell/portalNav";
import WarRoomScreen from "@/components/features/warroom/WarRoomScreen";
import MessagesScreen from "@/components/features/messaging/MessagesScreen";
import ProfileForm from "@/components/features/profile/ProfileForm";
import TeacherApplicationBanner from "@/components/features/teachers/onboarding/TeacherApplicationBanner";
import DashboardTab from "./tabs/DashboardTab";
import MyCoursesTab from "./tabs/MyCoursesTab";
import EnrollmentScoresTab from "./tabs/EnrollmentScoresTab";
import ProgressTab from "./tabs/ProgressTab";
import InstructionalManualsTab from "./tabs/InstructionalManualsTab";
import CurriculumDocumentsTab from "./tabs/CurriculumDocumentsTab";
import RequestsTab from "./tabs/RequestsTab";
import StudentConcernsTab from "./tabs/StudentConcernsTab";
import InstructorProfileTab from "./tabs/InstructorProfileTab";
import AdvisorQuestionsTab from "./tabs/AdvisorQuestionsTab";
import LiveClassesTab from "./tabs/LiveClassesTab";


function TeacherPortalContent({ slug = DEFAULT_PORTAL_SLUG }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    items: students,
    total: studentsTotal,
    loadEnrolledStudents,
  } = useTeacherEnrolledStudents();

  const { isAuthenticated, role, user } = useAuth();
  const isFacultyLoggedIn = isAuthenticated && role === AUTH_ROLES.FACULTY;

  const activeTab = isValidPortalSlug(AUTH_ROLES.FACULTY, slug)
    ? slug
    : DEFAULT_PORTAL_SLUG;

  useEffect(() => {
    if (isFacultyLoggedIn) {
      loadEnrolledStudents();
    }
  }, [isFacultyLoggedIn, loadEnrolledStudents]);

  // Back-compatibility with the portal's previous `?tab=` URLs — a bookmark
  // or an old link lands on the matching route rather than the dashboard.
  useEffect(() => {
    const legacyTab = searchParams.get("tab");
    if (!legacyTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const target = isValidPortalSlug(AUTH_ROLES.FACULTY, legacyTab)
      ? legacyTab
      : DEFAULT_PORTAL_SLUG;
    const query = params.toString();
    const target_href = portalHref(AUTH_ROLES.FACULTY, target);
    router.replace(query ? `${target_href}?${query}` : target_href, { scroll: false });
  }, [router, searchParams]);

  if (!isFacultyLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-cn-p-card border border-cn-p-line rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cn-p-soft border border-cn-p-soft text-cn-p-soft-ink flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-cn-p-ink mb-1.5">
            Faculty access required
          </h2>
          <p className="text-sm text-cn-p-ink-2 font-light mb-6">
            Sign in with a teacher account to open the Faculty Suite.
          </p>
          <button
            type="button"
            onClick={() => router.push(ROUTES.LOGIN)}
            className="w-full py-3.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-bold text-sm rounded-xl transition"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <PortalShell
      role={AUTH_ROLES.FACULTY}
      activeSlug={activeTab}
      user={{ name: user?.name }}
      today={new Date()}
      badges={{ students: studentsTotal || students.length || null }}
    >
      {/* Renders nothing for an approved teacher, and for every teacher an
          admin created. A teacher who applied and is waiting gets the portal
          now rather than a read-only holding page, so this is what says where
          the review has got to and why course creation is still closed. */}
      <TeacherApplicationBanner />

      <TabTransition activeKey={activeTab}>
        {activeTab === "dashboard" && <DashboardTab students={students} />}
        {activeTab === "courses" && <MyCoursesTab />}
        {activeTab === "students" && <EnrollmentScoresTab />}
        {activeTab === "classes" && <LiveClassesTab />}
        {activeTab === "warroom" && <WarRoomScreen />}
        {activeTab === "messages" && <MessagesScreen />}
        {activeTab === "advisor" && user?.isAdvisor && <AdvisorQuestionsTab />}
        {activeTab === "progress" && <ProgressTab />}
        {activeTab === "manuals" && <InstructionalManualsTab />}
        {activeTab === "documents" && <CurriculumDocumentsTab />}
        {activeTab === "public-profile" && <InstructorProfileTab />}
        {activeTab === "profile" && <ProfileForm />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "concerns" && <StudentConcernsTab />}
      </TabTransition>
    </PortalShell>
  );
}

export default function TeacherPortal({ slug }) {
  return (
    <Suspense fallback={<Loader tone="cobalt" label="Loading teacher portal..." />}>
      <TeacherPortalContent slug={slug} />
    </Suspense>
  );
}
