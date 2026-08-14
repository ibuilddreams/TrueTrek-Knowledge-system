import { backendClient } from "./apiClient";

export async function getPublicPathways({ page = 1, pageSize = 100, search } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  return backendClient.get(`/pathways/public/?${params.toString()}`);
}

export async function getPublicPathwayById(id) {
  return backendClient.get(`/pathways/public/${id}/`);
}

export async function getAdminPathways({ pageSize = 100, search, status } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return backendClient.get(`/pathways/?${params.toString()}`);
}

export async function getPathwayById(id) {
  return backendClient.get(`/pathways/${id}/`);
}

export async function createPathway(payload) {
  return backendClient.post("/pathways/", payload);
}

export async function updatePathway(id, payload) {
  return backendClient.patch(`/pathways/${id}/`, payload);
}

export async function deletePathway(id) {
  return backendClient.delete(`/pathways/${id}/`);
}

export async function attachCourseToPathway(pathwayId, courseId) {
  return backendClient.post(`/pathways/${pathwayId}/courses/`, { course: courseId });
}

export async function detachCourseFromPathway(pathwayId, courseId) {
  return backendClient.delete(`/pathways/${pathwayId}/courses/${courseId}/`);
}

export async function reorderPathwayCourses(pathwayId, entries) {
  return backendClient.patch(`/pathways/${pathwayId}/courses/order/`, entries);
}

export async function getBundleRules() {
  return backendClient.get("/pathways/bundle-rules/");
}

export async function createBundleRule(payload) {
  return backendClient.post("/pathways/bundle-rules/", payload);
}

export async function updateBundleRule(id, payload) {
  return backendClient.patch(`/pathways/bundle-rules/${id}/`, payload);
}

export async function deleteBundleRule(id) {
  return backendClient.delete(`/pathways/bundle-rules/${id}/`);
}

export async function checkoutPathways(pathwayIds) {
  return backendClient.post("/pathways/checkout/", { pathway_ids: pathwayIds });
}

export async function getMyPathways() {
  return backendClient.get("/pathways/mine/");
}
