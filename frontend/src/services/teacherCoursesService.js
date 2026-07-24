import { backendClient } from "./apiClient";

export async function getTeacherAssignedCourses() {
  return backendClient.get("/teacher/me/assignedcourses");
}

export async function getTeacherAssignedCoursesWithStudents() {
  return backendClient.get("/teacher/me/assignedcourses/studentsenrolled");
}

export async function getTeacherEnrolledStudentDetail(studentId) {
  return backendClient.get(`/teacher/me/students/${studentId}/`);
}
