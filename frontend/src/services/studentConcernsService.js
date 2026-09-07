import { backendClient } from "./apiClient";

// Teacher — flag and track own concerns
export async function createStudentConcern(payload) {
  return backendClient.post("/student-concerns/", payload);
}

export async function getMyStudentConcerns({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/student-concerns/?${params.toString()}`);
}

export async function getMyStudentConcern(id) {
  return backendClient.get(`/student-concerns/${id}/`);
}

// Admin — review and resolve all student concerns
export async function getAdminStudentConcerns({
  page = 1,
  pageSize = 10,
  status,
  category,
  requiresAdminAttention,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (requiresAdminAttention !== undefined) {
    params.set("requires_admin_attention", requiresAdminAttention);
  }
  if (search) params.set("search", search);
  return backendClient.get(`/student-concerns/admin/?${params.toString()}`);
}

export async function getAdminStudentConcern(id) {
  return backendClient.get(`/student-concerns/admin/${id}/`);
}

export async function updateStudentConcern(id, payload) {
  return backendClient.patch(`/student-concerns/admin/${id}/`, payload);
}
