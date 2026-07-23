"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/features/portal/Portal";
import { usePortalSession } from "@/hooks/usePortalSession";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import Loader from "@/components/ui/Loader";

export default function PortalPage() {
  const router = useRouter();
  const session = usePortalSession();
  const { isAuthenticated, role, status } = useAuth();

  const isResolving = status === "idle" || status === "loading";
  const shouldLeaveForDashboard =
    isAuthenticated &&
    (role === AUTH_ROLES.ADMIN || role === AUTH_ROLES.FACULTY);

  useEffect(() => {
    if (isResolving) return;
    if (shouldLeaveForDashboard) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isResolving, shouldLeaveForDashboard, router]);

  if (isResolving) {
    return <Loader label="Loading Portal..." />;
  }

  if (shouldLeaveForDashboard) {
    return <Loader label="Redirecting to Dashboard..." />;
  }

  const isLoggedIn = isAuthenticated && role === AUTH_ROLES.STUDENT;

  return (
    <Portal
      isLoggedIn={isLoggedIn}
      setIsLoggedIn={session.setIsLoggedIn}
      drillCompletedList={session.drillCompletedList}
      setDrillCompletedList={session.setDrillCompletedList}
      streakDays={session.streakDays}
      setStreakDays={session.setStreakDays}
      aggregateScore={session.aggregateScore}
      setAggregateScore={session.setAggregateScore}
    />
  );
}
