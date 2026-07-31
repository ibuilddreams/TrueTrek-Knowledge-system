"use client";

import { useQuery } from "@tanstack/react-query";
import { getLessons } from "@/services/lessonsService";

export function useModuleLessons(moduleId, enabled = true) {
  return useQuery({
    queryKey: ["studentLessons", moduleId],
    queryFn: async () => {
      const response = await getLessons({ moduleId });
      return response?.data?.results || [];
    },
    enabled: Boolean(moduleId) && enabled,
  });
}
