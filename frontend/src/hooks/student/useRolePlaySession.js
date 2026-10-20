"use client";

import { useQuery } from "@tanstack/react-query";
import { getRolePlaySession } from "@/services/wargamerService";

export const ROLEPLAY_SESSION_QUERY_KEY = "roleplay-session";

/**
 * One role-play session — its transcript while the scene is running, and its
 * report card once it has been scored.
 *
 * Deliberately *not* polled, unlike useMediaKitReview: nothing here advances
 * on its own. Every change is the direct result of a mutation this tab fired
 * (a reply, a score, a walk-away), and each of those returns the whole
 * updated session, which is written straight into this cache entry. A poll
 * would only ever re-fetch what the student just caused.
 */
export function useRolePlaySession(sessionId, { enabled = true } = {}) {
  return useQuery({
    queryKey: [ROLEPLAY_SESSION_QUERY_KEY, sessionId],
    queryFn: async () => {
      const response = await getRolePlaySession(sessionId);
      return response?.data || null;
    },
    enabled: enabled && Boolean(sessionId),
  });
}
