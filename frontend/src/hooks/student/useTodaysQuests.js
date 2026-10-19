"use client";

import { useQuery } from "@tanstack/react-query";
import { getTodaysQuests } from "@/services/questsService";

export const TODAYS_QUESTS_QUERY_KEY = ["quests", "today"];

// Shared query key/fn so the Quests tab and any other surface that wants the
// day's progress (header chips, dashboard card) read one cache entry rather
// than firing duplicate requests — same arrangement as useDailyDrillToday.
export function useTodaysQuests({ enabled = true } = {}) {
  return useQuery({
    queryKey: TODAYS_QUESTS_QUERY_KEY,
    queryFn: async () => {
      const response = await getTodaysQuests();
      return response?.data || { quests: [], stats: null };
    },
    enabled,
  });
}
