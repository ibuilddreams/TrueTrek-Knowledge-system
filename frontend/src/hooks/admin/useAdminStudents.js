"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents } from "@/services/studentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  studentsFetchFailed,
  studentsFetchStart,
  studentsFetchSucceeded,
  selectStudents,
} from "@/store/slices/students/studentsSlice";

export function useAdminStudents() {
  const dispatch = useDispatch();
  const students = useSelector(selectStudents);

  const loadStudents = useCallback(
    async ({ force = false } = {}) => {
      if (!force && (students.status === "loading" || students.status === "succeeded")) {
        return;
      }

      dispatch(studentsFetchStart());
      try {
        const response = await getStudents();
        const data = response?.data || {};
        dispatch(
          studentsFetchSucceeded({
            items: data.users || [],
            count: data.count || 0,
            queryKey: "all",
          })
        );
      } catch (error) {
        dispatch(studentsFetchFailed(getApiErrorMessage(error, "Unable to load students.")));
      }
    },
    [dispatch, students.status]
  );

  return { ...students, loadStudents };
}
