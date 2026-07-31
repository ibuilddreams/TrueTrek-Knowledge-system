"use client";

import { useCallback, useRef } from "react";
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
  const statusRef = useRef(teachers.status);
  statusRef.current = teachers.status;

  const loadTeachers = useCallback(
    async ({ force = false } = {}) => {
      if (!force && statusRef.current !== "idle") {
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
    [dispatch]
  );

  return { ...teachers, loadTeachers };
}
