"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCourses } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  coursesFetchFailed,
  coursesFetchStart,
  coursesFetchSucceeded,
  selectCourses,
} from "@/store/slices/courses/coursesSlice";

export function useAdminCourses() {
  const dispatch = useDispatch();
  const courses = useSelector(selectCourses);

  const loadCourses = useCallback(
    async ({ force = false, search, status, category, tags } = {}) => {
      if (!force && (courses.status === "loading" || courses.status === "succeeded")) {
        return;
      }

      dispatch(coursesFetchStart());
      try {
        const response = await getCourses({ search, status, category, tags });
        const data = response?.data || {};
        dispatch(
          coursesFetchSucceeded({
            items: data.results || [],
            count: data.count || 0,
            queryKey: "all",
          })
        );
      } catch (error) {
        dispatch(coursesFetchFailed(getApiErrorMessage(error, "Unable to load courses.")));
      }
    },
    [dispatch, courses.status]
  );

  return { ...courses, loadCourses };
}
