"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDashboardOverview } from "@/services/adminService";
import {
  overviewFetchFailed,
  overviewFetchStart,
  overviewFetchSucceeded,
  selectAdminOverview,
} from "@/store/slices/adminOverview/adminOverviewSlice";

export function useAdminOverview() {
  const dispatch = useDispatch();
  const overview = useSelector(selectAdminOverview);

  const loadOverview = useCallback(
    async ({ force = false } = {}) => {
      if (!force && (overview.status === "loading" || overview.status === "succeeded")) {
        return;
      }

      dispatch(overviewFetchStart());
      try {
        const response = await getDashboardOverview();
        dispatch(overviewFetchSucceeded(response?.data || null));
      } catch (error) {
        dispatch(overviewFetchFailed(error?.message || "Unable to load dashboard data."));
      }
    },
    [dispatch, overview.status]
  );

  return { ...overview, loadOverview };
}
