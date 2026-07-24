import { backendClient } from "./apiClient";

export async function getStudents({ pageSize = 100 } = {}) {
  return backendClient.get(`/user/student/admin/?page_size=${pageSize}`);
}

export async function getStudentById(id) {
  return backendClient.get(`/user/student/${id}/admin/`);
}

export async function createStudent(payload) {
  return backendClient.post("/user/student/admin/", payload);
}

export async function updateStudent(id, payload) {
  return backendClient.patch(`/user/student/${id}/admin/`, payload);
}

export async function deleteStudent(id) {
  return backendClient.delete(`/user/student/${id}/admin/`);
}
