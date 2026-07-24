import { backendClient } from "./apiClient";

export async function getTeachers({ pageSize = 100 } = {}) {
  return backendClient.get(`/teacher/admin/?page_size=${pageSize}`);
}

export async function getTeacherById(id) {
  return backendClient.get(`/teacher/${id}/admin/`);
}

export async function createTeacher(payload) {
  return backendClient.post("/teacher/admin/", payload);
}

export async function updateTeacher(id, payload) {
  return backendClient.patch(`/teacher/${id}/admin/`, payload);
}

export async function deleteTeacher(id) {
  return backendClient.delete(`/teacher/${id}/admin/`);
}
