"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPastSessions,
  getSessionStats,
  getUpcomingSessions,
} from "@/services/liveSessionsService";

// A session's UPCOMING/LIVE/ENDED state is derived server-side from the clock
// (live_sessions/services.py::live_state), so a card left open on screen
// would otherwise never notice the room opening. Re-fetching on this cadence
// is what flips "Starts in 10 min" over to a working "Join" button without a
// page refresh.
export const SESSION_REFRESH_MS = 60_000;

export function useUpcomingSessions({ enabled = true, pageSize = 20 } = {}) {
  return useQuery({
    queryKey: ["live-sessions", "upcoming", pageSize],
    queryFn: async () => {
      const response = await getUpcomingSessions({ pageSize });
      return response?.data?.results || [];
    },
    enabled,
    refetchInterval: SESSION_REFRESH_MS,
  });
}

export function usePastSessions({ enabled = true, pageSize = 20 } = {}) {
  return useQuery({
    queryKey: ["live-sessions", "past", pageSize],
    queryFn: async () => {
      const response = await getPastSessions({ pageSize });
      return response?.data?.results || [];
    },
    enabled,
  });
}

export function useSessionStats({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["live-sessions", "stats"],
    queryFn: async () => {
      const response = await getSessionStats();
      return response?.data || null;
    },
    enabled,
  });
}
