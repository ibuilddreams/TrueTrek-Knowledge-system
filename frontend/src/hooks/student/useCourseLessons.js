"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getLessons } from "@/services/lessonsService";

/**
 * Fetches full lesson content (file/video_url etc.) for whichever modules of a course
 * are in `enabledModuleIds` — not every module up front, so opening one lesson doesn't
 * fire a request per module on a course with many of them. Shares its query key with
 * useModuleLessons, so a module already expanded in the accordion view (or vice versa)
 * is served from cache instead of refetching.
 */
export function useCourseLessons(modules, enabledModuleIds) {
  const moduleIds = useMemo(() => (modules || []).map((module) => module.id), [modules]);

  const queries = useQueries({
    queries: moduleIds.map((moduleId) => ({
      queryKey: ["studentLessons", moduleId],
      queryFn: async () => {
        const response = await getLessons({ moduleId });
        return response?.data?.results || [];
      },
      enabled: Boolean(moduleId) && enabledModuleIds.has(moduleId),
    })),
  });

  const lessonsByModuleId = useMemo(() => {
    const map = new Map();
    moduleIds.forEach((moduleId, index) => {
      map.set(moduleId, queries[index]?.data || []);
    });
    return map;
  }, [moduleIds, queries]);

  const loadingModuleIds = useMemo(() => {
    const set = new Set();
    moduleIds.forEach((moduleId, index) => {
      if (queries[index]?.isLoading) set.add(moduleId);
    });
    return set;
  }, [moduleIds, queries]);

  return { lessonsByModuleId, loadingModuleIds };
}
