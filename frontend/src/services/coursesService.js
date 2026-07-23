import { backendClient } from "./apiClient";

export async function getCourses({ pageSize = 100 } = {}) {
  return backendClient.get(`/courses/?page_size=${pageSize}`);
}
