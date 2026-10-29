"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMyPastClasses,
  getMyUpcomingClasses,
} from "@/services/classSessionsService";

// A class's UPCOMING/LIVE/ENDED state — and whether its "Join" button works —
// is derived server-side from the clock (class_sessions/services.py::
// live_state), so a tab left open would never notice the room opening.
// Re-fetching on this cadence is what turns "Starts in 10 min" into a live
// Join button without a page refresh. Same reasoning, same interval as
// useLiveSessions.
export const CLASS_REFRESH_MS = 60_000;

export function useMyUpcomingClasses({ enabled = true, pageSize = 20 } = {}) {
  return useQuery({
    queryKey: ["class-sessions", "my", "upcoming", pageSize],
    queryFn: async () => {
      const response = await getMyUpcomingClasses({ pageSize });
      return response?.data?.results || [];
    },
    enabled,
    refetchInterval: CLASS_REFRESH_MS,
  });
}

export function useMyPastClasses({ enabled = true, pageSize = 20 } = {}) {
  return useQuery({
    queryKey: ["class-sessions", "my", "past", pageSize],
    queryFn: async () => {
      const response = await getMyPastClasses({ pageSize });
      return response?.data?.results || [];
    },
    enabled,
  });
}
