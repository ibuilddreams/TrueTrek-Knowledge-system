"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPathways } from "@/services/pathwaysService";

/**
 * A student with zero active pathway entitlements hasn't completed onboarding
 * (questionnaire -> recommendation -> preview -> checkout) yet — used to gate
 * portal access so the flow can't be skipped by logging in directly or
 * navigating straight to /studentportal. `enabled` should be false for
 * unauthenticated visitors and non-student roles (pathways are a student-only
 * concept; teachers/admins are never gated).
 */
export function useNeedsOnboarding(enabled) {
  const query = useQuery({
    queryKey: ["my-pathways-onboarding-check"],
    queryFn: async () => {
      const response = await getMyPathways();
      return response?.data || [];
    },
    enabled,
    refetchOnWindowFocus: false,
  });

  return {
    isChecking: enabled && query.isLoading,
    needsOnboarding: enabled && !query.isLoading && (query.data?.length || 0) === 0,
  };
}
