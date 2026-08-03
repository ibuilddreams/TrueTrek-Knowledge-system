"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentPortal from "@/components/features/portal/StudentPortal";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { getPortalRouteForRole } from "@/constants/routes";
import Loader from "@/components/ui/Loader";

export default function StudentPortalPage() {
  const router = useRouter();
  const { isAuthenticated, role, status } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;

    if (isAuthenticated && role !== AUTH_ROLES.STUDENT) {
      router.replace(getPortalRouteForRole(role));
    }
  }, [isResolving, isAuthenticated, role, router]);

  if (isResolving) {
    return <Loader label="Loading Student Portal..." />;
  }

  if (isAuthenticated && role !== AUTH_ROLES.STUDENT) {
    return <Loader label="Redirecting..." />;
  }

  return <StudentPortal />;
}
