"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getTeacherAssignedCourses,
  getTeacherAssignedCoursesWithStudents,
} from "@/services/teacherCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  teacherCoursesFetchStart,
  teacherCoursesFetchSucceeded,
  teacherCoursesFetchFailed,
  selectTeacherCourses,
} from "@/store/slices/teacherCourses/teacherCoursesSlice";

export function useTeacherCourses() {
  const dispatch = useDispatch();
  const teacherCourses = useSelector(selectTeacherCourses);

  const loadCourses = useCallback(
    async ({ force = false } = {}) => {
      if (!force && (teacherCourses.status === "loading" || teacherCourses.status === "succeeded")) {
        return;
      }

      dispatch(teacherCoursesFetchStart());
      try {
        const [statsResponse, withStudentsResponse] = await Promise.all([
          getTeacherAssignedCourses(),
          getTeacherAssignedCoursesWithStudents(),
        ]);

        dispatch(
          teacherCoursesFetchSucceeded({
            stats: statsResponse?.data || null,
            withStudents: withStudentsResponse?.data || null,
          })
        );
      } catch (error) {
        dispatch(
          teacherCoursesFetchFailed(getApiErrorMessage(error, "Unable to load your assigned courses."))
        );
      }
    },
    [dispatch, teacherCourses.status]
  );

  return { ...teacherCourses, loadCourses };
}
