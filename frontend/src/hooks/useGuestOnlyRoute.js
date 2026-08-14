"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNeedsOnboarding } from "@/hooks/useNeedsOnboarding";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";

export function useGuestOnlyRoute() {
  const router = useRouter();
  const { status, isAuthenticated, role } = useAuth();

  const isResolving = status === "idle" || status === "loading";
  const isStudentRole = role === AUTH_ROLES.STUDENT;

  // Pathways/onboarding are a student-only concept — teachers and admins
  // always go straight to their own portal, never through this check (they
  // have no pathway entitlements by design, which would otherwise look
  // indistinguishable from "hasn't onboarded yet").
  const { isChecking: isCheckingOnboarding, needsOnboarding } = useNeedsOnboarding(
    isAuthenticated && isStudentRole
  );

  useEffect(() => {
    if (isResolving || !isAuthenticated) return;
    if (isStudentRole && isCheckingOnboarding) return;
    router.replace(
      isStudentRole && needsOnboarding ? ROUTES.ONBOARDING : getPortalRouteForRole(role)
    );
  }, [isResolving, isAuthenticated, isStudentRole, isCheckingOnboarding, needsOnboarding, role, router]);

  return {
    isResolving,
    isAuthenticated,
    shouldBlock: isResolving || isAuthenticated,
  };
}
