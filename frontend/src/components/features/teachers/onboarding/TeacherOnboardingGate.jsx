"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeacherOnboardingStatus } from "@/services/teacherOnboardingService";
import Loader from "@/components/ui/Loader";
import TeacherOnboardingScreen from "./TeacherOnboardingScreen";
import { TEACHER_ONBOARDING_STATUS_QUERY_KEY } from "./queryKeys";

/**
 * Stands in front of the Faculty Portal.
 *
 * A teacher an admin created holds no application and falls straight through —
 * which is the whole reason the server answers "requires_onboarding" rather
 * than the client guessing from a role. A teacher who signed themselves up
 * sees the application instead of the portal until an admin approves it.
 *
 * The gate is the honest part of the story, not the enforcement: the server
 * refuses course creation from an unapproved account regardless of what this
 * renders (`teacher_onboarding.permissions.IsApprovedTeacher`).
 */
export default function TeacherOnboardingGate({ enabled = true, children }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: TEACHER_ONBOARDING_STATUS_QUERY_KEY,
    queryFn: async () => (await getTeacherOnboardingStatus())?.data,
    enabled,
    // An approval arrives from somebody else's browser, so nothing here would
    // otherwise notice it. A minute's polling is what makes the waiting
    // teacher's portal open up on its own — the banner clears and course
    // creation starts working — and it keys off approval rather than portal
    // access, since a submitted teacher is already inside the portal and is
    // still waiting on exactly that. Once approved, it stops.
    refetchInterval: (query) => {
      const state = query.state.data;
      return state?.requires_onboarding && !state?.is_approved ? 60000 : false;
    },
  });

  if (!enabled) return children;

  if (isLoading) {
    return <Loader label="Checking your access..." />;
  }

  // A failed check never locks a teacher out of a portal they may well be
  // entitled to — the server is still the thing that refuses anything real.
  if (isError || !data?.requires_onboarding || data?.can_access_portal) {
    return children;
  }

  return <TeacherOnboardingScreen />;
}
