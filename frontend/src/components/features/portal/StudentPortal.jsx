"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import confetti from "canvas-confetti";
import { usePortalSession } from "@/hooks/usePortalSession";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { ROUTES } from "@/constants/routes";
import TabNav from "@/components/ui/TabNav";
import TabTransition from "@/components/ui/TabTransition";
import Loader from "@/components/ui/Loader";
import {
  PORTAL_TABS,
  VALID_PORTAL_TABS,
  DEFAULT_PORTAL_TAB,
  resolvePortalTab,
  buildPortalBadges,
} from "./portalConstants";
import PortalHeader from "./PortalHeader";
import PortalToast from "./PortalToast";
import DashboardTab from "./tabs/DashboardTab";
import CoursesTab from "./tabs/CoursesTab";
import DrillTab from "./tabs/DrillTab";
import WarRoomTab from "./tabs/WarRoomTab";
import AchievementsTab from "./tabs/AchievementsTab";

function StudentPortalContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const session = usePortalSession();
  const {
    isLoggedIn,
    drillCompletedList,
    setDrillCompletedList,
    streakDays,
    setStreakDays,
    aggregateScore,
    setAggregateScore,
    points,
    setPoints,
    completedModules,
    setCompletedModules,
    consultationCount,
    setConsultationCount,
    unlockedBadges,
    setUnlockedBadges,
  } = session;

  const { displayName, status: profileStatus } = useStudentProfile(isLoggedIn);
  const [lastNotification, setLastNotification] = useState(null);

  const activeTab = useMemo(
    () => resolvePortalTab(searchParams.get("tab")),
    [searchParams]
  );

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (rawTab && !VALID_PORTAL_TABS.has(rawTab)) {
      router.replace(pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!lastNotification) return undefined;
    const timer = setTimeout(() => setLastNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [lastNotification]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const badges = buildPortalBadges({
      isLoggedIn,
      drillCompletedList,
      aggregateScore,
      consultationCount,
      streakDays,
      completedModules,
    });

    const newlyUnlocked = badges.filter(
      (badge) => badge.isUnlocked && !unlockedBadges.includes(badge.id)
    );

    if (newlyUnlocked.length === 0) return;

    const latest = newlyUnlocked[newlyUnlocked.length - 1];
    setUnlockedBadges((prev) => {
      const merged = [...prev];
      newlyUnlocked.forEach((badge) => {
        if (!merged.includes(badge.id)) merged.push(badge.id);
      });
      return merged;
    });
    setLastNotification({
      title: "🏆 BADGE UNLOCKED!",
      desc: `${latest.title}: ${latest.desc}`,
      type: "badge",
    });
    confetti({
      particleCount: 100,
      spread: 70,
      colors: ["#fbbf24", "#f59e0b", "#d97706"],
    });
  }, [
    isLoggedIn,
    completedModules,
    drillCompletedList,
    streakDays,
    consultationCount,
    aggregateScore,
    unlockedBadges,
    setUnlockedBadges,
  ]);

  const setActiveTab = useCallback(
    (tabId) => {
      const nextTab = resolvePortalTab(tabId);
      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === DEFAULT_PORTAL_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1.5">
            Student Access Required
          </h2>
          <p className="text-xs text-stone-500 font-light mb-6">
            Sign in with a student account to open drills, the war room, and your
            progress suite.
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
      id="student-portal-view"
      className="py-10 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto min-h-[85vh] font-sans"
    >
      <PortalToast
        notification={lastNotification}
        onDismiss={() => setLastNotification(null)}
      />

      <PortalHeader
        displayName={displayName}
        profileStatus={profileStatus}
        points={points}
        streakDays={streakDays}
        aggregateScore={aggregateScore}
      />

      <div className="mb-8">
        <TabNav
          tabs={PORTAL_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Student portal sections"
        />
      </div>

      <TabTransition activeKey={activeTab}>
        {activeTab === "dashboard" && (
          <DashboardTab
            drillCompletedList={drillCompletedList}
            aggregateScore={aggregateScore}
          />
        )}
        {activeTab === "courses" && <CoursesTab />}
        {activeTab === "drill" && (
          <DrillTab
            drillCompletedList={drillCompletedList}
            setDrillCompletedList={setDrillCompletedList}
            setPoints={setPoints}
            setStreakDays={setStreakDays}
            setAggregateScore={setAggregateScore}
            onNotify={setLastNotification}
          />
        )}
        {activeTab === "warroom" && (
          <WarRoomTab
            setConsultationCount={setConsultationCount}
            setPoints={setPoints}
            onNotify={setLastNotification}
          />
        )}
        {activeTab === "achievements" && (
          <AchievementsTab
            isLoggedIn={isLoggedIn}
            points={points}
            setPoints={setPoints}
            completedModules={completedModules}
            setCompletedModules={setCompletedModules}
            drillCompletedList={drillCompletedList}
            aggregateScore={aggregateScore}
            consultationCount={consultationCount}
            streakDays={streakDays}
            unlockedBadges={unlockedBadges}
            onNotify={setLastNotification}
          />
        )}
      </TabTransition>
    </div>
  );
}

export default function StudentPortal() {
  return (
    <Suspense fallback={<Loader label="Loading Student Portal..." />}>
      <StudentPortalContent />
    </Suspense>
  );
}
