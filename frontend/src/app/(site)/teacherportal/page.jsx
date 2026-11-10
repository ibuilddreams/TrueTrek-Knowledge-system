"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TeacherPortal from "@/components/features/teachers/TeacherPortal";
import TeacherOnboardingGate from "@/components/features/teachers/onboarding/TeacherOnboardingGate";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import Loader from "@/components/ui/Loader";

export default function TeacherPortalPage() {
  const router = useRouter();
  const { role, status, isAuthenticated } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (role !== AUTH_ROLES.FACULTY) {
      router.replace(getPortalRouteForRole(role));
    }
  }, [isResolving, isAuthenticated, role, router]);

  if (isResolving) {
    return <Loader label="Loading Teacher Portal..." />;
  }

  if (!isAuthenticated) {
    return <Loader label="Redirecting to Sign In..." />;
  }

  if (role !== AUTH_ROLES.FACULTY) {
    return <Loader label="Redirecting..." />;
  }

  // A teacher who signed themselves up completes an application here first;
  // one an admin created falls straight through to the portal. The gate asks
  // the server which this is rather than guessing — see
  // components/features/teachers/onboarding/TeacherOnboardingGate.jsx.
  return (
    <TeacherOnboardingGate>
      <TeacherPortal />
    </TeacherOnboardingGate>
  );
}
