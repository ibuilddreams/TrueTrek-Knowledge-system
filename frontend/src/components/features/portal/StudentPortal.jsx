"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { usePortalSession } from "@/hooks/usePortalSession";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useNeedsOnboarding } from "@/hooks/useNeedsOnboarding";
import { useDailyDrillToday } from "@/hooks/student/useDailyDrillToday";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { getPublicCourseBySlug } from "@/services/coursesService";
import { purchaseCourses } from "@/services/enrollmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import PortalShell from "./shell/PortalShell";
import { StreakChip } from "./shell/PortalTopbar";
import {
  DEFAULT_PORTAL_SLUG,
  isValidPortalSlug,
  portalHref,
} from "./shell/portalNav";
import PortalToast from "./PortalToast";
import DailyDrillReminderModal from "./DailyDrillReminderModal";
import BuyCourseModal from "./BuyCourseModal";
import StudentDashboard from "./dashboard/StudentDashboard";
import CoursesTab from "./tabs/CoursesTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import QuizzesTab from "./tabs/QuizzesTab";
import CertificatesTab from "./tabs/CertificatesTab";
import DrillTab from "./tabs/DrillTab";
import QuestsTab from "./tabs/QuestsTab";
import WargamerTab from "./tabs/WargamerTab";
import LiveClassesTab from "./tabs/LiveClassesTab";
import BrandValidatorTab from "./tabs/BrandValidatorTab";
import WarRoomLiveTab from "./tabs/WarRoomLiveTab";
import RewardsTab from "./tabs/RewardsTab";
import StreakTab from "./tabs/StreakTab";
import AskAdvisorTab from "./tabs/AskAdvisorTab";
import WarRoomScreen from "@/components/features/warroom/WarRoomScreen";
import MessagesScreen from "@/components/features/messaging/MessagesScreen";

// Shown at most once per calendar day (persisted per drill_date so a
// refresh of the Drill screen doesn't re-nag) — see the reminder effect below.
const DRILL_REMINDER_STORAGE_PREFIX = "ttl:dailyDrillReminderShown:";

function StudentPortalContent({ slug = DEFAULT_PORTAL_SLUG }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const session = usePortalSession();
  const {
    isLoggedIn,
    streakDays,
    setStreakDays,
    setStreakDetail,
    setAggregateScore,
    setPoints,
  } = session;

  const { displayName } = useStudentProfile(isLoggedIn);
  const [lastNotification, setLastNotification] = useState(null);
  const [showDrillReminder, setShowDrillReminder] = useState(false);

  // A student with no purchased/assigned pathway yet hasn't finished
  // onboarding — send them back into it instead of showing an empty
  // dashboard, whether they landed here via login or a direct/bookmarked URL.
  const { isChecking: isCheckingOnboarding, needsOnboarding } = useNeedsOnboarding(isLoggedIn);

  useEffect(() => {
    if (needsOnboarding) router.replace(ROUTES.ONBOARDING);
  }, [needsOnboarding, router]);

  // Fetched once here (regardless of which screen is open) so the header's
  // streak chip reflects real data as soon as the portal loads.
  const { data: drillData } = useDailyDrillToday({ enabled: isLoggedIn });
  const drillStats = drillData?.stats;

  useEffect(() => {
    if (!drillStats) return;
    setPoints(drillStats.points);
    setStreakDays(drillStats.streak);
    setStreakDetail(drillStats.streak_detail || null);
    setAggregateScore(drillStats.aggregate_score);
    // The setters' identities change with the values they set (see
    // usePortalSession) — depending on the raw stat values here, not the
    // setters, avoids re-firing this effect forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillStats?.points, drillStats?.streak, drillStats?.streak_detail, drillStats?.aggregate_score]);

  const activeSlug = isValidPortalSlug(AUTH_ROLES.STUDENT, slug)
    ? slug
    : DEFAULT_PORTAL_SLUG;

  const goToSlug = useCallback(
    (nextSlug) => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // Detail views (course/assignment/quiz) live in the query string, so
      // moving to another screen drops them: coming back should start at
      // that screen's list rather than whatever was last opened.
      router.push(portalHref(AUTH_ROLES.STUDENT, nextSlug));
    },
    [router],
  );

  // Back-compatibility with the portal's previous `?tab=` URLs — anything
  // still linking that way (a bookmark, an old email) lands on the matching
  // route instead of silently showing the dashboard.
  useEffect(() => {
    const legacyTab = searchParams.get("tab");
    if (!legacyTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const target = isValidPortalSlug(AUTH_ROLES.STUDENT, legacyTab)
      ? legacyTab
      : DEFAULT_PORTAL_SLUG;
    const query = params.toString();
    const href = portalHref(AUTH_ROLES.STUDENT, target);
    router.replace(query ? `${href}?${query}` : href, { scroll: false });
  }, [router, searchParams]);

  // Whether today's drill still needs the student's attention — completion is
  // represented differently per drill source (see daily_drill.services).
  const isDrillCompletedToday = useMemo(() => {
    if (!drillData || drillData.type === "UNAVAILABLE") return true;
    if (drillData.type === "ADMIN_VIDEO") return drillData.progress?.status === "COMPLETED";
    return Boolean(drillData.attempted);
  }, [drillData]);

  // Nudge the student when they open the Daily Drill screen with today's drill
  // still incomplete — shown at most once per day via localStorage.
  useEffect(() => {
    if (activeSlug !== "drill" || !drillData) return;
    if (drillData.type === "UNAVAILABLE" || isDrillCompletedToday) return;

    const storageKey = `${DRILL_REMINDER_STORAGE_PREFIX}${drillData.drill_date}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall through and
      // still show the reminder rather than silently failing.
    }
    setShowDrillReminder(true);
  }, [activeSlug, drillData, isDrillCompletedToday]);

  useEffect(() => {
    if (!lastNotification) return undefined;
    const timer = setTimeout(() => setLastNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [lastNotification]);

  // "Enroll now" on a store card sends a signed-in student here with
  // `?buy=<slug>`, and the course is fetched by that slug so the modal can
  // name it and price it.
  const queryClient = useQueryClient();
  const buySlug = searchParams.get("buy");
  const [isBuying, setIsBuying] = useState(false);

  const buyCourseQuery = useQuery({
    queryKey: ["public-course-detail", buySlug],
    queryFn: async () => (await getPublicCourseBySlug(buySlug)).data,
    enabled: Boolean(buySlug),
  });

  const closeBuyModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("buy");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const confirmPurchase = useCallback(
    async (course) => {
      setIsBuying(true);
      try {
        const response = await purchaseCourses(course.id);
        const result = response?.data || {};
        if (result.already_enrolled?.length) {
          toastSuccess(`You already have ${course.title}. It's in My courses.`);
        } else {
          toastSuccess(`${course.title} is yours — it's in My courses.`);
        }
        // The purchase changes what the portal shows, so every list that
        // counts or names enrolled courses has to be re-read.
        await queryClient.invalidateQueries();
        closeBuyModal();
      } catch (error) {
        toastError(
          getApiErrorMessage(error, "That purchase could not be completed."),
        );
      } finally {
        setIsBuying(false);
      }
    },
    [closeBuyModal, queryClient],
  );

  // The reminder only ever shows while already on the Drill screen, so
  // "Start Drill" just reveals the content beneath it; "Later" backs out.
  const handleLaterFromReminder = useCallback(() => {
    setShowDrillReminder(false);
    goToSlug(DEFAULT_PORTAL_SLUG);
  }, [goToSlug]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-cn-lg border border-cn-p-line bg-white p-8 text-center shadow-cn-3">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-cn-p-soft text-cn-p-accent">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mb-1.5 text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-cn-p-ink">
            Student access required
          </h2>
          <p className="mb-6 text-sm text-cn-p-ink-2">
            Sign in with a student account to open your courses, drills and
            progress.
          </p>
          <button
            type="button"
            onClick={() => router.push(ROUTES.LOGIN)}
            className="inline-flex h-[50px] w-full items-center justify-center rounded-cn-sm bg-cn-p-accent px-6 text-cn-base font-semibold text-white transition-colors duration-150 hover:bg-cn-p-accent-hover"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  if (isCheckingOnboarding || needsOnboarding) {
    return <Loader label="Checking your pathway access..." />;
  }

  return (
    <PortalShell
      role={AUTH_ROLES.STUDENT}
      activeSlug={activeSlug}
      user={{ name: displayName }}
      today={new Date()}
      chip={<StreakChip days={streakDays} onClick={() => goToSlug("streak")} />}
    >
      <PortalToast
        notification={lastNotification}
        onDismiss={() => setLastNotification(null)}
      />

      <DailyDrillReminderModal
        isOpen={showDrillReminder}
        onClose={() => setShowDrillReminder(false)}
        onLater={handleLaterFromReminder}
        onStartDrill={() => setShowDrillReminder(false)}
      />

      {activeSlug === "dashboard" && <StudentDashboard onNavigate={goToSlug} />}
      {activeSlug === "courses" && <CoursesTab />}
      {activeSlug === "assignments" && <AssignmentsTab />}
      {activeSlug === "quizzes" && <QuizzesTab />}
      {activeSlug === "certificates" && <CertificatesTab studentName={displayName} />}
      {activeSlug === "live-classes" && <LiveClassesTab />}
      {activeSlug === "drill" && <DrillTab onNotify={setLastNotification} />}
      {activeSlug === "quests" && (
        <QuestsTab
          onNotify={setLastNotification}
          onOpenRewards={() => goToSlug("rewards")}
        />
      )}
      {activeSlug === "warroom" && <WarRoomScreen />}
      {activeSlug === "wargamer" && <WargamerTab />}
      {activeSlug === "brand-validator" && <BrandValidatorTab />}
      {activeSlug === "warroom-live" && <WarRoomLiveTab />}
      {activeSlug === "rewards" && <RewardsTab />}
      {activeSlug === "advisor" && <AskAdvisorTab />}
      {activeSlug === "messages" && <MessagesScreen />}
      {activeSlug === "streak" && (
        <StreakTab onBack={() => goToSlug(DEFAULT_PORTAL_SLUG)} />
      )}

      <BuyCourseModal
        isOpen={Boolean(buySlug) && Boolean(buyCourseQuery.data)}
        course={buyCourseQuery.data}
        isSubmitting={isBuying}
        onClose={closeBuyModal}
        onConfirm={confirmPurchase}
      />
    </PortalShell>
  );
}

export default function StudentPortal({ slug }) {
  return (
    <Suspense fallback={<Loader label="Loading Cool Nerdz Portal..." />}>
      <StudentPortalContent slug={slug} />
    </Suspense>
  );
}
