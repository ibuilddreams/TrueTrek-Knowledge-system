import { backendClient } from "./apiClient";

export async function getTeacherAssignedCourses({ search, status, category, tags } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (tags) params.set("tags", tags);
  const query = params.toString();
  return backendClient.get(`/teacher/me/assignedcourses${query ? `?${query}` : ""}`);
}

export async function getTeacherAssignedCoursesWithStudents() {
  return backendClient.get("/teacher/me/assignedcourses/studentsenrolled");
}

export async function getTeacherEnrolledStudentDetail(studentId) {
  return backendClient.get(`/teacher/me/students/${studentId}/`);
}

// Placeholder endpoint — swap the path once the backend confirms the real one.
export async function getTeacherCourseStudents(courseId) {
  return backendClient.get(`/teacher/me/courses/${courseId}/students`);
}
