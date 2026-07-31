"use client";

import { useCallback, useRef } from "react";
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
  const statusRef = useRef(students.status);
  statusRef.current = students.status;

  const loadStudents = useCallback(
    async ({ force = false } = {}) => {
      if (!force && statusRef.current !== "idle") {
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
    [dispatch]
  );

  return { ...students, loadStudents };
}
