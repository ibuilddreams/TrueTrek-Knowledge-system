import { backendClient } from "./apiClient";

export async function getStudents({ pageSize = 100 } = {}) {
  return backendClient.get(`/users/students/admin/?page_size=${pageSize}`);
}
