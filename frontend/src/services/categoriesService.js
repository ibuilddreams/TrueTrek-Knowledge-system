import { backendClient } from "./apiClient";

export async function getCategories({ pageSize = 100 } = {}) {
  return backendClient.get(`/courses/categories/?page_size=${pageSize}`);
}
