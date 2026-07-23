import { backendClient } from "./apiClient";

export async function getEnrollments({ pageSize = 100 } = {}) {
  return backendClient.get(`/enrollments/admin/?page_size=${pageSize}`);
}

export async function createEnrollment({ student, course }) {
  return backendClient.post("/enrollments/admin/", { student, course });
}

export async function updateEnrollmentStatus(id, { status, note }) {
  return backendClient.patch(`/enrollments/${id}/admin/`, { status, note });
}
