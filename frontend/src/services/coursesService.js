import { backendClient } from "./apiClient";

export async function getCourses({ pageSize = 100 } = {}) {
  return backendClient.get(`/courses/?page_size=${pageSize}`);
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
