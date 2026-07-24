import { backendClient } from "./apiClient";

export async function getStudents({ pageSize = 100 } = {}) {
  return backendClient.get(`/student/admin/?page_size=${pageSize}`);
}

export async function getStudentById(id) {
  return backendClient.get(`/student/${id}/admin/`);
}

export async function createStudent(payload) {
  return backendClient.post("/student/admin/", payload);
}

export async function updateStudent(id, payload) {
  return backendClient.patch(`/student/${id}/admin/`, payload);
}

export async function deleteStudent(id) {
  return backendClient.delete(`/student/${id}/admin/`);
}
