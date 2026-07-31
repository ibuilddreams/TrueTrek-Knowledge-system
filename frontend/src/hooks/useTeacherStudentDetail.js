"use client";

import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeacherEnrolledStudentDetail } from "@/services/teacherCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  teacherStudentDetailFetchStart,
  teacherStudentDetailFetchSucceeded,
  teacherStudentDetailFetchFailed,
  teacherStudentDetailCleared,
  selectTeacherStudentDetail,
} from "@/store/slices/teacherStudentDetail/teacherStudentDetailSlice";

export function useTeacherStudentDetail() {
  const dispatch = useDispatch();
  const studentDetail = useSelector(selectTeacherStudentDetail);
  const detailRef = useRef(studentDetail);
  detailRef.current = studentDetail;

  const loadStudentDetail = useCallback(
    async (studentId) => {
      if (!studentId) return;
      const current = detailRef.current;
      if (
        current.studentId === studentId &&
        (current.status === "loading" || current.status === "succeeded")
      ) {
        return;
      }

      dispatch(teacherStudentDetailFetchStart({ studentId }));
      try {
        const response = await getTeacherEnrolledStudentDetail(studentId);
        dispatch(teacherStudentDetailFetchSucceeded({ data: response?.data || null }));
      } catch (error) {
        dispatch(
          teacherStudentDetailFetchFailed(
            getApiErrorMessage(error, "Unable to load this student's details.")
          )
        );
      }
    },
    [dispatch]
  );

  const clearStudentDetail = useCallback(() => {
    dispatch(teacherStudentDetailCleared());
  }, [dispatch]);

  return { ...studentDetail, loadStudentDetail, clearStudentDetail };
}
