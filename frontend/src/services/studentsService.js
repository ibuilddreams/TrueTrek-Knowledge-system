import { backendClient } from "./apiClient";

export async function getStudents({ pageSize = 100 } = {}) {
  return backendClient.get(`/users/students/admin/?page_size=${pageSize}`);
}

export async function getStudentById(id) {
  return backendClient.get(`/users/students/${id}/admin/`);
}

export async function createStudent(payload) {
  return backendClient.post("/users/students/admin/", payload);
}

export async function updateStudent(id, payload) {
  return backendClient.patch(`/users/students/${id}/admin/`, payload);
}

export async function deleteStudent(id) {
  return backendClient.delete(`/users/students/${id}/admin/`);
}
