"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeacherEnrolledStudents } from "@/services/teacherCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  teacherEnrolledStudentsFetchStart,
  teacherEnrolledStudentsFetchSucceeded,
  teacherEnrolledStudentsFetchFailed,
  selectTeacherEnrolledStudents,
} from "@/store/slices/teacherEnrolledStudents/teacherEnrolledStudentsSlice";

export function useTeacherEnrolledStudents() {
  const dispatch = useDispatch();
  const roster = useSelector(selectTeacherEnrolledStudents);

  const loadEnrolledStudents = useCallback(
    async ({ force = false } = {}) => {
      if (!force && (roster.status === "loading" || roster.status === "succeeded")) {
        return;
      }

      dispatch(teacherEnrolledStudentsFetchStart());
      try {
        const response = await getTeacherEnrolledStudents();
        dispatch(
          teacherEnrolledStudentsFetchSucceeded({
            students: response?.data?.students || [],
            total_students: response?.data?.total_students || 0,
          })
        );
      } catch (error) {
        dispatch(
          teacherEnrolledStudentsFetchFailed(
            getApiErrorMessage(error, "Unable to load enrolled students.")
          )
        );
      }
    },
    [dispatch, roster.status]
  );

  return { ...roster, loadEnrolledStudents };
}
