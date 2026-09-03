import { backendClient } from "./apiClient";

// Student — self-service
export async function getMyPointsSummary() {
  return backendClient.get("/rewards/points/my/");
}

export async function getMyPointsTransactions({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/rewards/points/my/transactions/?${params.toString()}`);
}

// Admin — visibility & manual adjustment
export async function getAdminStudentPoints({ page = 1, pageSize = 10, search } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  return backendClient.get(`/rewards/points/admin/students/?${params.toString()}`);
}

export async function getAdminStudentPointsDetail(studentId) {
  return backendClient.get(`/rewards/points/admin/students/${studentId}/`);
}

export async function getAdminPointsTransactions({ page = 1, pageSize = 10, student, type } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (student) params.set("student", student);
  if (type) params.set("type", type);
  return backendClient.get(`/rewards/points/admin/transactions/?${params.toString()}`);
}

export async function adjustStudentPoints(payload) {
  return backendClient.post("/rewards/points/admin/adjust/", payload);
}
