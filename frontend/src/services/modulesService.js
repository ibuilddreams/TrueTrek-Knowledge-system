import { backendClient } from "./apiClient";

export async function getModules({ courseId, pageSize = 100 } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (courseId) params.set("course", courseId);
  return backendClient.get(`/modules/?${params.toString()}`);
}

export async function createModule(payload) {
  return backendClient.post("/modules/", payload);
}

export async function updateModule(id, payload) {
  return backendClient.patch(`/modules/${id}/`, payload);
}

export async function deleteModule(id) {
  return backendClient.delete(`/modules/${id}/`);
}
