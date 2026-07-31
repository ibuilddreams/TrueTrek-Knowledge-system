import { backendClient } from "./apiClient";

export async function getStudentAssignments() {
  return backendClient.get("/assignments/student/");
}

export async function getStudentQuizzes() {
  return backendClient.get("/quizzes/student/");
}

export async function getStudentGrades() {
  return backendClient.get("/quizzes/student/grades/");
}

export async function getStudentCertificates() {
  return backendClient.get("/enrollments/student/certificates/");
}
