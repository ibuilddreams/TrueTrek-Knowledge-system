"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPastSessions,
  getSession,
  getSessionStats,
  getUpcomingSessions,
} from "@/services/liveSessionsService";

// A session's UPCOMING/LIVE/ENDED state is derived server-side from the clock
// (live_sessions/services.py::live_state), so a card left open on screen
// would otherwise never notice the room opening. Re-fetching on this cadence
// is what flips "Starts in 10 min" over to a working "Join" button without a
// page refresh.
export const SESSION_REFRESH_MS = 60_000;

// How often somebody *inside* a room re-asks about the session they are in.
// Far faster than the lists above, because the thing it is watching for — a
// host opening or closing the floor — has to reach a listener's microphone
// button while they are still wondering whether to say something.
export const ROOM_REFRESH_MS = 10_000;

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

/**
 * One session, re-asked while somebody is actually in its room.
 *
 * The lists behind the cards poll once a minute, which is fine for a card and
 * far too slow for a room: opening the floor has to reach a listener's
 * microphone button in seconds, not at the next refresh of a list they are
 * not even looking at.
 *
 * It is the *session* that is polled rather than a room endpoint, because
 * the session is where the floor lives — a token is only ever minted for one
 * person at the moment they ask for it, and this is how a client knows there
 * is a new one worth asking for.
 */
export function useLiveSession(sessionId, { enabled = true, poll = false } = {}) {
  return useQuery({
    queryKey: ["live-sessions", "detail", sessionId],
    queryFn: async () => {
      const response = await getSession(sessionId);
      return response?.data || null;
    },
    enabled: Boolean(sessionId) && enabled,
    refetchInterval: poll ? ROOM_REFRESH_MS : false,
    retry: false,
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
