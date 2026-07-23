import { backendClient } from "./apiClient";

export async function createEnrollment({ student, course }) {
  return backendClient.post("/enrollments/admin/", { student, course });
}
