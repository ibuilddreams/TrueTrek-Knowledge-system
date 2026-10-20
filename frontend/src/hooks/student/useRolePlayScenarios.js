"use client";

import { useQuery } from "@tanstack/react-query";
import { getRolePlayScenarios } from "@/services/wargamerService";

export const ROLEPLAY_SCENARIOS_QUERY_KEY = ["roleplay", "scenarios"];

/**
 * The LS-302 scenario picker: the published catalog, this student's progress
 * against each scenario, and the module summary — all from one request, the
 * same shape useTodaysQuests reads its board from.
 */
export function useRolePlayScenarios({ enabled = true } = {}) {
  return useQuery({
    queryKey: ROLEPLAY_SCENARIOS_QUERY_KEY,
    queryFn: async () => {
      const response = await getRolePlayScenarios();
      return response?.data || { module: null, scenarios: [], stats: null };
    },
    enabled,
  });
}
