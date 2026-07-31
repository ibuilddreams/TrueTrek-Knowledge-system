"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeLesson } from "@/services/lessonsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

export function useCompleteLesson(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId) => completeLesson(lessonId),
    onSuccess: (response) => {
      toastSuccess(response?.message || "Lesson marked as completed");
      queryClient.invalidateQueries({ queryKey: ["studentEnrolledCourseDetail", courseId] });
      queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to mark this lesson as completed."));
    },
  });
}
