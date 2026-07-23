"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeachers } from "@/services/teachersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  teachersFetchFailed,
  teachersFetchStart,
  teachersFetchSucceeded,
  selectTeachers,
} from "@/store/slices/teachers/teachersSlice";

export function useAdminTeachers() {
  const dispatch = useDispatch();
  const teachers = useSelector(selectTeachers);

  const loadTeachers = useCallback(
    async ({ force = false } = {}) => {
      if (!force && (teachers.status === "loading" || teachers.status === "succeeded")) {
        return;
      }

      dispatch(teachersFetchStart());
      try {
        const response = await getTeachers();
        const data = response?.data || {};
        dispatch(
          teachersFetchSucceeded({
            items: data.users || [],
            count: data.count || 0,
            queryKey: "all",
          })
        );
      } catch (error) {
        dispatch(teachersFetchFailed(getApiErrorMessage(error, "Unable to load teachers.")));
      }
    },
    [dispatch, teachers.status]
  );

  return { ...teachers, loadTeachers };
}
