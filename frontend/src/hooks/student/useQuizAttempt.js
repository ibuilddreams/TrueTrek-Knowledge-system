"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  autosaveQuizAttempt,
  getQuizAttemptMyDetail,
  getQuizAttemptResult,
  requestQuizSelfRetry,
  startQuizAttempt,
  submitQuizAttempt,
} from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quizId) => startQuizAttempt(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentQuizzes"] });
      queryClient.invalidateQueries({ queryKey: ["studentQuizAttempts"] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to start this quiz attempt."));
    },
  });
}

// Task 18 (Phase 5) follow-up — the student's self-service path once every
// attempt on a quiz is used up without passing: request one more directly
// instead of the only option being to wait on a teacher/admin grant.
export function useRequestQuizSelfRetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quizId) => requestQuizSelfRetry(quizId),
    onSuccess: (response) => {
      toastSuccess(response?.message || "You have another attempt — good luck!");
      queryClient.invalidateQueries({ queryKey: ["studentQuizzes"] });
      queryClient.invalidateQueries({ queryKey: ["studentQuizAttempts"] });
      // A grant raises this quiz's effective attempts_allowed, which also
      // changes the number a locked module's lock_info shows (see below) —
      // same reasoning as useSubmitQuizAttempt's invalidation.
      queryClient.invalidateQueries({ queryKey: ["studentEnrolledCourseDetail"] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to request another attempt."));
    },
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, payload }) => submitQuizAttempt(attemptId, payload),
    onSuccess: (response) => {
      toastSuccess(response?.message || "Quiz submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["studentQuizzes"] });
      queryClient.invalidateQueries({ queryKey: ["studentQuizAttempts"] });
      // Task 18 — a submission can flip is_passed, which can lock or unlock
      // modules (progress.services.get_module_lock_map). The curriculum
      // panel's module list comes from a *different* query
      // (["studentEnrolledCourseDetail", courseId], see
      // CourseDetailScreen.jsx) that this mutation has no other reason to
      // know about, so without this it kept showing a stale lock state
      // until something else happened to refetch it (e.g. a full reload).
      // Invalidated without a specific courseId (matches every cached
      // entry via TanStack Query's default partial key match) since this
      // hook is shared across quiz-taking surfaces that don't all have one
      // on hand — mirrors useCompleteLesson's exact-key invalidation for
      // the same query, just broader because courseId isn't always known here.
      queryClient.invalidateQueries({ queryKey: ["studentEnrolledCourseDetail"] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to submit this quiz attempt."));
    },
  });
}

export function useAutosaveQuizAttempt() {
  return useMutation({
    mutationFn: ({ attemptId, payload, keepalive }) =>
      autosaveQuizAttempt(attemptId, payload, keepalive ? { keepalive: true } : undefined),
    // Autosave runs silently in the background — a dropped request just means the next
    // debounced save (or the final submit) picks up the answers instead, no need to
    // interrupt the student with a toast.
    retry: 1,
  });
}

export function useQuizAttemptResult(attemptId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["quizAttemptResult", attemptId],
    queryFn: async () => {
      const response = await getQuizAttemptResult(attemptId);
      return response?.data || null;
    },
    enabled: Boolean(attemptId) && enabled,
  });
}

export function useQuizAttemptMyDetail(attemptId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["quizAttemptMyDetail", attemptId],
    queryFn: async () => {
      const response = await getQuizAttemptMyDetail(attemptId);
      return response?.data || null;
    },
    enabled: Boolean(attemptId) && enabled,
  });
}
