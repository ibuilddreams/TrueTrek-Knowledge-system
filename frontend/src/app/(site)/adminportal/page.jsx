"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/features/admin/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import Loader from "@/components/ui/Loader";

export default function AdminPortalPage() {
  const router = useRouter();
  const { role, status, isAuthenticated } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (role !== AUTH_ROLES.ADMIN) {
      router.replace(getPortalRouteForRole(role));
    }
  }, [isResolving, isAuthenticated, role, router]);

  if (isResolving) {
    return <Loader label="Loading Admin Portal..." />;
  }

  if (!isAuthenticated) {
    return <Loader label="Redirecting to Sign In..." />;
  }

  if (role !== AUTH_ROLES.ADMIN) {
    return <Loader label="Redirecting..." />;
  }

  return <AdminDashboard />;
}
