import { backendClient } from "./apiClient";

export async function getTeachers({ pageSize = 100 } = {}) {
  return backendClient.get(`/users/teachers/admin/?page_size=${pageSize}`);
}

export async function getTeacherById(id) {
  return backendClient.get(`/users/teachers/${id}/admin/`);
}

export async function createTeacher(payload) {
  return backendClient.post("/users/teachers/admin/", payload);
}

export async function updateTeacher(id, payload) {
  return backendClient.patch(`/users/teachers/${id}/admin/`, payload);
}

export async function deleteTeacher(id) {
  return backendClient.delete(`/users/teachers/${id}/admin/`);
}
