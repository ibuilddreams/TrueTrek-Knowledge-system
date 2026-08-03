"use client";

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeacherDashboardStats } from "@/services/teacherDashboardService";
import {
  teacherDashboardFetchStart,
  teacherDashboardFetchSucceeded,
  teacherDashboardFetchFailed,
  selectTeacherDashboard,
} from "@/store/slices/teacherDashboard/teacherDashboardSlice";

export function useTeacherDashboard() {
  const dispatch = useDispatch();
  const dashboard = useSelector(selectTeacherDashboard);
  const statusRef = useRef(dashboard.status);
  statusRef.current = dashboard.status;

  const loadDashboard = useCallback(
    async ({ force = false } = {}) => {
      if (!force && statusRef.current !== "idle") {
        return;
      }

      dispatch(teacherDashboardFetchStart());
      try {
        const response = await getTeacherDashboardStats();
        dispatch(teacherDashboardFetchSucceeded(response?.data || null));
      } catch (error) {
        dispatch(
          teacherDashboardFetchFailed(error?.message || "Unable to load dashboard data.")
        );
      }
    },
    [dispatch]
  );

  return { ...dashboard, loadDashboard };
}
