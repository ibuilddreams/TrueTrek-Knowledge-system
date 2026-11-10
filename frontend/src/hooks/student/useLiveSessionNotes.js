"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSessionNotes,
  startSessionNotes,
  stopSessionNotes,
} from "@/services/liveSessionsService";

/**
 * One War Room Live session's meeting notes, for every surface that cares.
 *
 * Three screens read this hook and they must never disagree: the "taking
 * notes" indicator and notes button inside the room, and the notes reader
 * somebody opens from a past session. They share one query key, so a host
 * pausing the notes updates the card behind the room too.
 *
 * The sibling of `useClassNotes`, and deliberately its own hook rather than
 * a parameter on it: the two read different endpoints on different apps, and
 * a shared cache key between them would hand one session's notes to another.
 */

// While a session is running, how often the room re-asks whether it is being
// written up. Slow on purpose: the answer changes at most a few times in a
// session, and everyone is already told at the moment they join
// (`useAgoraCall`'s `wasTakingNotesAtJoin`).
export const SESSION_NOTES_POLL_MS = 20_000;

// Once a session is over the notes are still being put together — the last
// audio has to land and the model has to write. A reader opened in that
// window polls faster, because the thing it is waiting for genuinely arrives
// while somebody is looking at the screen.
export const SESSION_NOTES_PENDING_POLL_MS = 15_000;

export function liveSessionNotesKey(sessionId) {
  return ["live-sessions", "notes", sessionId];
}

export function useLiveSessionNotes(sessionId, { enabled = true, poll = false } = {}) {
  return useQuery({
    queryKey: liveSessionNotesKey(sessionId),
    queryFn: async () => {
      const response = await getSessionNotes(sessionId);
      return response?.data || null;
    },
    enabled: Boolean(sessionId) && enabled,
    refetchInterval: (query) => {
      const state = query?.state?.data;
      // Keep polling through the write-up even when the caller didn't ask
      // for it: somebody with the reader open is waiting for exactly this,
      // and a session that has just ended settles within a minute or two.
      if (state?.is_writing || state?.is_transcribing) {
        return poll ? SESSION_NOTES_POLL_MS : SESSION_NOTES_PENDING_POLL_MS;
      }
      return poll ? SESSION_NOTES_POLL_MS : false;
    },
    retry: false,
  });
}

/**
 * The host's start / stop notes buttons.
 *
 * Stopping is a **pause**, not an ending: what has been recorded stays on the
 * run, pressing start again resumes it, and the write-up happens when the
 * session ends. Both mutations write the returned state straight into the
 * cache so the button settles immediately rather than waiting for the next
 * poll to catch up.
 */
export function useLiveSessionNotesControls(sessionId) {
  const queryClient = useQueryClient();

  const writeState = (response) => {
    if (response?.data) {
      queryClient.setQueryData(liveSessionNotesKey(sessionId), response.data);
    }
    // The cards behind the room carry their own notes flags.
    queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-live-sessions"] });
  };

  const start = useMutation({
    mutationFn: () => startSessionNotes(sessionId),
    onSuccess: writeState,
  });

  const stop = useMutation({
    mutationFn: () => stopSessionNotes(sessionId),
    onSuccess: writeState,
  });

  return { start, stop, isBusy: start.isPending || stop.isPending };
}
