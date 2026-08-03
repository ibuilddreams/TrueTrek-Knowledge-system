"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentAssignments } from "@/services/studentLearningService";

export function useStudentAssignments({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["studentAssignments"],
    queryFn: async () => {
      const response = await getStudentAssignments();
      return response?.data || [];
    },
    enabled,
  });
}
