"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentPortal from "@/components/features/portal/StudentPortal";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import Loader from "@/components/ui/Loader";

export default function PortalPage() {
  const router = useRouter();
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

  return <StudentPortal />;
}
