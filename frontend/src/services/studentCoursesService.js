import { backendClient } from "./apiClient";

export async function getStudentEnrollments({ page = 1, pageSize = 100 } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  return backendClient.get(`/enrollments/student/?${params.toString()}`);
}
