"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClassNotes,
  startClassNotes,
  stopClassNotes,
} from "@/services/classSessionsService";

/**
 * One class's meeting notes, for every surface that cares about them.
 *
 * Three screens read this hook and they must never disagree: the "taking
 * notes" indicator and notes button inside the classroom, and the notes
 * reader a student opens from a past class. They share one query key, so a
 * teacher stopping the notes updates the card behind the classroom too.
 *
 * Deliberately a sibling of `useClassRecording` rather than part of it. Notes
 * and recording are different Agora products on different per-class
 * switches — a class can be written up without being filmed — so they are
 * fetched separately and either can be unavailable while the other works.
 */

// While a class is running, how often the classroom re-asks whether it is
// being written up. Slow on purpose: the answer changes at most a few times
// in a class, and everyone in the room is already told at the moment they
// join (`useAgoraCall`'s `wasTakingNotesAtJoin`).
export const NOTES_POLL_MS = 20_000;

// Once a class is over the notes are still being put together — the bot has
// to leave, the last captions have to land and the model has to write. A
// reader opened in that window polls faster, because the thing it is waiting
// for genuinely arrives while somebody is looking at the screen.
export const NOTES_PENDING_POLL_MS = 15_000;

export function classNotesKey(sessionId) {
  return ["class-sessions", "notes", sessionId];
}

export function useClassNotes(sessionId, { enabled = true, poll = false } = {}) {
  return useQuery({
    queryKey: classNotesKey(sessionId),
    queryFn: async () => {
      const response = await getClassNotes(sessionId);
      return response?.data || null;
    },
    enabled: Boolean(sessionId) && enabled,
    refetchInterval: (query) => {
      const state = query?.state?.data;
      // Keep polling through the write-up even when the caller didn't ask
      // for it: somebody with the notes reader open is waiting for exactly
      // this, and a class that has just ended settles within a minute or two.
      if (state?.is_writing || state?.is_transcribing) {
        return poll ? NOTES_POLL_MS : NOTES_PENDING_POLL_MS;
      }
      return poll ? NOTES_POLL_MS : false;
    },
    retry: false,
  });
}

/**
 * The teacher's start / stop notes buttons.
 *
 * Stopping is not instant by design: the server pulls the transcription bot
 * out and its own thread finishes the job, which is also what notifies the
 * class. Both mutations therefore write the returned state straight into the
 * cache so the button settles immediately rather than waiting for the next
 * poll to catch up.
 */
export function useClassNotesControls(sessionId) {
  const queryClient = useQueryClient();

  const writeState = (response) => {
    if (response?.data) {
      queryClient.setQueryData(classNotesKey(sessionId), response.data);
    }
    // The card behind the classroom carries its own notes flags.
    queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
  };

  const start = useMutation({
    mutationFn: () => startClassNotes(sessionId),
    onSuccess: writeState,
  });

  const stop = useMutation({
    mutationFn: () => stopClassNotes(sessionId),
    onSuccess: writeState,
  });

  return { start, stop, isBusy: start.isPending || stop.isPending };
}
