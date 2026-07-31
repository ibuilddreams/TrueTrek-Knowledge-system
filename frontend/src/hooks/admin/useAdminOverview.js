"use client";

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAdminDashboardActivityProgress,
  getAdminDashboardCharts,
  getAdminDashboardStatistics,
} from "@/services/adminService";
import {
  overviewFetchFailed,
  overviewFetchStart,
  overviewFetchSucceeded,
  selectAdminOverview,
} from "@/store/slices/adminOverview/adminOverviewSlice";

export function useAdminOverview() {
  const dispatch = useDispatch();
  const overview = useSelector(selectAdminOverview);
  const statusRef = useRef(overview.status);
  statusRef.current = overview.status;

  const loadOverview = useCallback(
    async ({ force = false } = {}) => {
      if (!force && statusRef.current !== "idle") {
        return;
      }

      dispatch(overviewFetchStart());
      try {
        const [statisticsResponse, activityProgressResponse, chartsResponse] = await Promise.all([
          getAdminDashboardStatistics(),
          getAdminDashboardActivityProgress(),
          getAdminDashboardCharts(),
        ]);

        dispatch(
          overviewFetchSucceeded({
            statistics: statisticsResponse?.data || null,
            recent_activities: activityProgressResponse?.data?.recent_activities || [],
            progress_summary: activityProgressResponse?.data?.progress_summary || [],
            charts: chartsResponse?.data || null,
          })
        );
      } catch (error) {
        dispatch(overviewFetchFailed(error?.message || "Unable to load dashboard data."));
      }
    },
    [dispatch]
  );

  return { ...overview, loadOverview };
}
