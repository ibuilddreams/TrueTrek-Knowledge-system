"use client";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingStatus } from "@/services/onboardingService";

/**
 * A self-signup student with zero active pathway entitlements hasn't completed
 * onboarding (questionnaire -> recommendation -> preview -> checkout) yet —
 * used to gate portal access so the flow can't be skipped by logging in
 * directly or navigating straight to /studentportal. Students invited by an
 * admin are exempt (decided server-side by the onboarding status endpoint).
 * `enabled` should be false for
 * unauthenticated visitors and non-student roles (pathways are a student-only
 * concept; teachers/admins are never gated).
 */
export function useNeedsOnboarding(enabled) {
  const query = useQuery({
    queryKey: ["my-pathways-onboarding-check"],
    queryFn: async () => {
      const response = await getOnboardingStatus();
      return response?.data || null;
    },
    enabled,
    refetchOnWindowFocus: false,
  });

  return {
    isChecking: enabled && query.isLoading,
    needsOnboarding: enabled && !query.isLoading && query.data?.required !== false,
  };
}
