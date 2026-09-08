"use client";

import { useQuery } from "@tanstack/react-query";
import { getStreakCalendar } from "@/services/dailyDrillService";

export function useStreakCalendar({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["streakCalendar"],
    queryFn: async () => {
      const response = await getStreakCalendar();
      return response?.data || null;
    },
    enabled,
  });
}
