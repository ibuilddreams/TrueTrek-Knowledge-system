"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentQuizzes } from "@/services/studentLearningService";

export function useStudentQuizzes({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["studentQuizzes"],
    queryFn: async () => {
      const response = await getStudentQuizzes();
      return response?.data || [];
    },
    enabled,
  });
}
