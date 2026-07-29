import { backendClient } from "./apiClient";

export async function getCategories({ pageSize = 100 } = {}) {
  return backendClient.get(`/courses/categories/?page_size=${pageSize}`);
}

export async function createCategory(payload) {
  return backendClient.post("/courses/categories/", payload);
}

export async function updateCategory(id, payload) {
  return backendClient.patch(`/courses/categories/${id}/`, payload);
}

export async function deleteCategory(id) {
  return backendClient.delete(`/courses/categories/${id}/`);
}
