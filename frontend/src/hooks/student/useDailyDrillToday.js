"use client";

import { useQuery } from "@tanstack/react-query";
import { getTodaysDrill } from "@/services/dailyDrillService";

// Shared query key/fn so StudentPortal.jsx (header stats, fetched once on
// portal load regardless of active tab) and DrillTab.jsx (drill content,
// only mounted while that tab is active) read the same TanStack Query cache
// entry instead of firing two separate requests or drifting out of sync.
export function useDailyDrillToday({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["daily-drill", "today"],
    queryFn: async () => {
      const response = await getTodaysDrill();
      return response?.data || null;
    },
    enabled,
  });
}
