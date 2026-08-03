"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentCertificates } from "@/services/studentLearningService";

export function useStudentCertificates({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["studentCertificates"],
    queryFn: async () => {
      const response = await getStudentCertificates();
      return response?.data || [];
    },
    enabled,
  });
}
