import { backendClient } from "./apiClient";

export async function getTags() {
  return backendClient.get("/courses/tags/");
}

export async function createTag(payload) {
  return backendClient.post("/courses/tags/", payload);
}

export async function updateTag(id, payload) {
  return backendClient.patch(`/courses/tags/${id}/`, payload);
}

export async function deleteTag(id) {
  return backendClient.delete(`/courses/tags/${id}/`);
}
