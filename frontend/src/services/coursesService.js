import { backendClient } from "./apiClient";

export async function getCourses({ pageSize = 100, search, status, category, tags } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (tags) params.set("tags", tags);
  return backendClient.get(`/courses/?${params.toString()}`);
}

export async function getCourseById(id) {
  return backendClient.get(`/courses/${id}/`);
}

export async function createCourse(payload) {
  return backendClient.post("/courses/", payload);
}

export async function updateCourse(id, payload) {
  return backendClient.patch(`/courses/${id}/`, payload);
}

export async function deleteCourse(id) {
  return backendClient.delete(`/courses/${id}/`);
}

export async function getCourseStatusChoices() {
  return backendClient.get("/courses/status-choices/");
}
