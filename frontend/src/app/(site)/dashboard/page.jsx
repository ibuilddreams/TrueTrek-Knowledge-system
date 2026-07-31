"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import Loader from "@/components/ui/Loader";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { role, status, isAuthenticated } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    router.replace(getPortalRouteForRole(role));
  }, [isResolving, isAuthenticated, role, router]);

  return <Loader label="Redirecting to Portal..." />;
}
