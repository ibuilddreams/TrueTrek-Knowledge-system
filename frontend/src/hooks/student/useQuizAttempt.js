"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  autosaveQuizAttempt,
  getQuizAttemptMyDetail,
  getQuizAttemptResult,
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

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, payload }) => submitQuizAttempt(attemptId, payload),
    onSuccess: (response) => {
      toastSuccess(response?.message || "Quiz submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["studentQuizzes"] });
      queryClient.invalidateQueries({ queryKey: ["studentQuizAttempts"] });
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
