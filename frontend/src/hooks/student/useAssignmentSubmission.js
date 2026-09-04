"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyAssignmentSubmission,
  retryAiReview,
  submitAssignment,
} from "@/services/assignmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

export function useMyAssignmentSubmission(assignmentId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["myAssignmentSubmission", assignmentId],
    queryFn: async () => {
      try {
        const response = await getMyAssignmentSubmission(assignmentId);
        return response?.data || null;
      } catch (error) {
        if (error?.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(assignmentId) && enabled,
  });
}

export function useSubmitAssignment(assignmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => submitAssignment(assignmentId, payload),
    onSuccess: (response) => {
      toastSuccess(response?.message || "Assignment submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["studentAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["myAssignmentSubmission", assignmentId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to submit this assignment."));
    },
  });
}

export function useRetryAiReview(assignmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryAiReview(assignmentId),
    onSuccess: (response) => {
      toastSuccess(response?.message || "AI review retried");
      queryClient.invalidateQueries({ queryKey: ["studentAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["myAssignmentSubmission", assignmentId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to retry the AI review right now."));
    },
  });
}
