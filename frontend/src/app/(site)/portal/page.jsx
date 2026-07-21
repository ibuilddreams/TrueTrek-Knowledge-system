"use client";

import Portal from "@/components/features/portal/Portal";
import { usePortalSession } from "@/hooks/usePortalSession";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";

export default function PortalPage() {
  const session = usePortalSession();
  const { isAuthenticated, role } = useAuth();

  const isLoggedIn =
    isAuthenticated && role === AUTH_ROLES.STUDENT;

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
