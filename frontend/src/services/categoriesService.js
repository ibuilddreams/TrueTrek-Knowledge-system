import { backendClient } from "./apiClient";

export async function getCategories({ pageSize = 100 } = {}) {
  return backendClient.get(`/courses/categories/?page_size=${pageSize}`);
}

export async function createCategory(payload) {
  return backendClient.post("/courses/categories/", payload);
}
