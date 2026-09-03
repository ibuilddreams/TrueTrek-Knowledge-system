import { backendClient } from "./apiClient";

// Teacher — submit and track own requests
export async function createTeacherRequest(payload) {
  return backendClient.post("/teacher-requests/", payload);
}

export async function getMyTeacherRequests({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/teacher-requests/?${params.toString()}`);
}

export async function getMyTeacherRequest(id) {
  return backendClient.get(`/teacher-requests/${id}/`);
}

// Admin — review and resolve all teacher requests
export async function getAdminTeacherRequests({
  page = 1,
  pageSize = 10,
  status,
  requestType,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (status) params.set("status", status);
  if (requestType) params.set("request_type", requestType);
  if (search) params.set("search", search);
  return backendClient.get(`/teacher-requests/admin/?${params.toString()}`);
}

export async function getAdminTeacherRequest(id) {
  return backendClient.get(`/teacher-requests/admin/${id}/`);
}

export async function updateTeacherRequest(id, payload) {
  return backendClient.patch(`/teacher-requests/admin/${id}/`, payload);
}
