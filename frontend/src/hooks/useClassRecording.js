"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClassRecording,
  startClassRecording,
  stopClassRecording,
} from "@/services/classSessionsService";

/**
 * One class's recording, for every surface that cares about it.
 *
 * Three screens read this hook and they must never disagree: the REC
 * indicator and record button inside the classroom, and the "Watch recording"
 * player a student opens from a past class. They share one query key, so a
 * teacher stopping a recording updates the card behind the classroom too.
 *
 * The playback URL this returns is **signed and short-lived** — the server
 * mints it per request and never stores one
 * (class_sessions/services.py::recording_playback_url) — so it is deliberately
 * never cached as fresh: the player asks again every time it opens rather
 * than handing a student a link that expired while the tab was in the
 * background.
 */

// While a class is running, how often the classroom re-asks whether it is
// being recorded. Slow on purpose: the answer changes at most a few times in
// a class, and everyone in the room is already told at the moment they join
// (`useAgoraCall`'s `wasRecordingAtJoin`).
export const RECORDING_POLL_MS = 20_000;

export function classRecordingKey(sessionId) {
  return ["class-sessions", "recording", sessionId];
}

export function useClassRecording(sessionId, { enabled = true, poll = false } = {}) {
  return useQuery({
    queryKey: classRecordingKey(sessionId),
    queryFn: async () => {
      const response = await getClassRecording(sessionId);
      return response?.data || null;
    },
    enabled: Boolean(sessionId) && enabled,
    refetchInterval: poll ? RECORDING_POLL_MS : false,
    // The URL inside this payload expires, so a cached copy is never treated
    // as good enough — every mount of the player asks the server again.
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

/**
 * The teacher's record / stop buttons.
 *
 * Stopping is not instant by design: the server marks the recording as
 * processing and its own thread finishes it, which is also what notifies the
 * class. Both mutations therefore write the returned state straight into the
 * cache so the button settles immediately rather than waiting for the next
 * poll to catch up.
 */
export function useClassRecordingControls(sessionId) {
  const queryClient = useQueryClient();

  const writeState = (response) => {
    if (response?.data) {
      queryClient.setQueryData(classRecordingKey(sessionId), response.data);
    }
    // The card behind the classroom carries its own recording flags.
    queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
  };

  const start = useMutation({
    mutationFn: () => startClassRecording(sessionId),
    onSuccess: writeState,
  });

  const stop = useMutation({
    mutationFn: () => stopClassRecording(sessionId),
    onSuccess: writeState,
  });

  return { start, stop, isBusy: start.isPending || stop.isPending };
}
