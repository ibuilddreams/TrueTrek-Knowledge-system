"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRouteForRole } from "@/constants/routes";

export function useGuestOnlyRoute() {
  const router = useRouter();
  const { status, isAuthenticated, role } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;
    if (isAuthenticated) {
      router.replace(getPortalRouteForRole(role));
    }
  }, [isResolving, isAuthenticated, role, router]);

  return {
    isResolving,
    isAuthenticated,
    shouldBlock: isResolving || isAuthenticated,
  };
}
