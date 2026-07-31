"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to submit this quiz attempt."));
    },
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
