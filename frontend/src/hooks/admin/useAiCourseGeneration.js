"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLatestCourseGeneration } from "@/services/aiCoursesService";

export const AI_GENERATION_POLL_MS = 2000;

// How long the AI service may report nothing new before the wizard says so.
// Measured against the live service: a real job sat on stage "starting" at 5%
// for 30 minutes, emitting only keep-alive heartbeats, so a silent progress bar
// is a state the admin genuinely hits and deserves a sentence rather than a
// guess about whether anything is still happening.
export const STALLED_AFTER_SECONDS = 120;

const TERMINAL_STATUSES = new Set(["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"]);

// Which finished generation this browser has already been shown. A UI
// acknowledgement, not state the server needs: the admin dismissing a result
// banner on their laptop says nothing about the generation itself.
const DISMISSED_STORAGE_KEY = "ttl:aiCourseGenerationDismissed";

export function isGenerationRunning(job) {
  return Boolean(job) && !TERMINAL_STATUSES.has(job.status);
}

export function isGenerationTerminal(job) {
  return Boolean(job) && TERMINAL_STATUSES.has(job.status);
}

export function didGenerationSucceed(job) {
  return job?.status === "SUCCEEDED" || job?.status === "PARTIAL";
}

function readDismissedId() {
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY);
  } catch {
    // localStorage unavailable (private browsing, etc.) — the banner just stays
    // dismissable for this session only, which is the harmless direction.
    return null;
  }
}

function writeDismissedId(value) {
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, value);
  } catch {
    /* See readDismissedId. */
  }
}

/**
 * Counts seconds since `since`, ticking only while `active`.
 *
 * Deliberately derived from a server timestamp rather than from a "we started
 * now" ref: a generation can be picked back up in a tab that never saw it
 * start, and an elapsed time that restarts at 0s on every reload would be a
 * lie about a job that has been running for half an hour.
 */
export function useElapsedSeconds(since, active) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!since) {
      setSeconds(0);
      return;
    }
    const startedAt = new Date(since).getTime();
    if (Number.isNaN(startedAt)) {
      setSeconds(0);
      return;
    }

    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    if (!active) return;

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [since, active]);

  return seconds;
}

export function formatElapsed(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/**
 * Watches the one AI course generation this admin should be offered back.
 *
 * The backend runs the generation on a background thread with no deadline, so
 * it outlives the wizard that started it — closing the modal, switching admin
 * tab or reloading the page all leave it running. This asks the server which
 * generation that is (rather than remembering a job id in React state, which
 * any of those three things would throw away) and polls it while it runs.
 *
 * `onSucceeded` fires when a generation is seen *becoming* successful, which is
 * the moment the new draft course exists and the course list is out of date. A
 * generation that was already finished when this mounted does not fire it — the
 * page's own mount-time fetch has the course already, and firing here would
 * refetch the list on every mount for a day.
 */
export function useAiCourseGenerationWatcher({ enabled = true, onSucceeded } = {}) {
  const [dismissedId, setDismissedId] = useState(null);
  const seenRef = useRef({ id: null, status: null });
  const onSucceededRef = useRef(onSucceeded);
  onSucceededRef.current = onSucceeded;

  // Read after mount, never during render: the server has no localStorage, and
  // a first paint that disagreed with it would be a hydration mismatch.
  useEffect(() => {
    setDismissedId(readDismissedId());
  }, []);

  const query = useQuery({
    queryKey: ["aiCourseGeneration", "latest"],
    queryFn: async () => {
      const response = await getLatestCourseGeneration();
      return response?.data || null;
    },
    enabled,
    // Overrides the app-wide default so a resumed progress bar shows where the
    // generation actually is, not where it was a minute ago.
    staleTime: 0,
    refetchInterval: (latest) =>
      isGenerationRunning(latest.state.data) ? AI_GENERATION_POLL_MS : false,
    refetchOnWindowFocus: true,
  });

  const job = query.data || null;

  useEffect(() => {
    const previous = seenRef.current;
    if (!job) {
      seenRef.current = { id: null, status: null };
      return;
    }

    const isFirstSighting = previous.id !== job.id;
    seenRef.current = { id: job.id, status: job.status };
    if (isFirstSighting || previous.status === job.status) return;
    if (didGenerationSucceed(job)) onSucceededRef.current?.(job);
  }, [job]);

  const dismiss = useCallback((jobId) => {
    const value = String(jobId);
    writeDismissedId(value);
    setDismissedId(value);
  }, []);

  // A running generation is never hidden: the admin cannot start another one
  // while it runs (the backend allows one in flight per user), so a hidden
  // progress bar would turn into an unexplained "already in progress" error.
  const isDismissed = isGenerationTerminal(job) && dismissedId === String(job?.id);

  return {
    job,
    visibleJob: job && !isDismissed ? job : null,
    dismiss,
    refetch: query.refetch,
  };
}
