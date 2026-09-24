import { backendClient } from "./apiClient";

export async function submitTestimonial(payload) {
  return backendClient.post("/testimonials/submit/", payload);
}

export async function getPublicTestimonials({ pageSize = 50 } = {}) {
  return backendClient.get(`/testimonials/public/?page_size=${pageSize}`);
}

export async function getAdminTestimonials({ pageSize = 100, status, search } = {}) {
  const params = new URLSearchParams({ page_size: String(pageSize) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return backendClient.get(`/testimonials/admin/?${params.toString()}`);
}

export async function publishTestimonial(id) {
  return backendClient.post(`/testimonials/admin/${id}/publish/`);
}

export async function hideTestimonial(id) {
  return backendClient.post(`/testimonials/admin/${id}/hide/`);
}

export async function deleteTestimonial(id) {
  return backendClient.delete(`/testimonials/admin/${id}/`);
}
