"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentQuizAttempts } from "@/services/studentLearningService";

export function useStudentQuizAttempts({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["studentQuizAttempts"],
    queryFn: async () => {
      const response = await getStudentQuizAttempts();
      return response?.data || [];
    },
    enabled,
  });
}
