"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEnrollments } from "@/services/enrollmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  enrollmentsFetchFailed,
  enrollmentsFetchStart,
  enrollmentsFetchSucceeded,
  selectEnrollments,
} from "@/store/slices/enrollments/enrollmentsSlice";

export function useAdminEnrollments() {
  const dispatch = useDispatch();
  const enrollments = useSelector(selectEnrollments);

  const loadEnrollments = useCallback(
    async ({ force = false } = {}) => {
      if (!force && (enrollments.status === "loading" || enrollments.status === "succeeded")) {
        return;
      }

      dispatch(enrollmentsFetchStart());
      try {
        const response = await getEnrollments();
        const data = response?.data || {};
        dispatch(
          enrollmentsFetchSucceeded({
            items: data.results || [],
            count: data.count || 0,
            queryKey: "all",
          })
        );
      } catch (error) {
        dispatch(enrollmentsFetchFailed(getApiErrorMessage(error, "Unable to load enrollments.")));
      }
    },
    [dispatch, enrollments.status]
  );

  return { ...enrollments, loadEnrollments };
}
