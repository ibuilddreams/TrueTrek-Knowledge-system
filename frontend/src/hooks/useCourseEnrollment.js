"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";

// Whether the signed-in student is already enrolled in a course. The
// enrolled-course endpoint 404s for a course they haven't enrolled in, which is
// exactly the "not enrolled" signal. Shares its query key with CourseEnrollPanel.
export function useCourseEnrollment(courseId) {
  const { status, user, isAuthenticated, isStudent } = useAuth();
  const isAuthResolved = status !== "idle" && status !== "loading";

  return useQuery({
    queryKey: ["curriculum-enrollment", user?.id, courseId],
    queryFn: async () => {
      try {
        await getStudentEnrolledCourseDetail(courseId);
        return true;
      } catch (error) {
        if (error?.status === 404) return false;
        throw error;
      }
    },
    enabled: isAuthResolved && isAuthenticated && isStudent && Boolean(courseId),
    retry: false,
  });
}
