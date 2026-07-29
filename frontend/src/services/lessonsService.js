import { backendClient } from "./apiClient";

export async function getLessons({ moduleId, courseId, pageSize = 100 } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (moduleId) params.set("module", moduleId);
  if (courseId) params.set("course", courseId);
  return backendClient.get(`/lessons/?${params.toString()}`);
}

export async function createLesson(payload) {
  return backendClient.post("/lessons/", payload);
}

export async function updateLesson(id, payload) {
  return backendClient.patch(`/lessons/${id}/`, payload);
}

export async function deleteLesson(id) {
  return backendClient.delete(`/lessons/${id}/`);
}

export async function reorderLessons(moduleId, entries) {
  return backendClient.patch(`/lessons/order/${moduleId}/`, entries);
}
