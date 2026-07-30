import { backendClient } from "./apiClient";

export async function getAssignments({ moduleId, courseId, pageSize = 100 } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (moduleId) params.set("module", moduleId);
  if (courseId) params.set("course", courseId);
  return backendClient.get(`/assignments/?${params.toString()}`);
}

export async function createAssignment(payload) {
  return backendClient.post("/assignments/", payload);
}

export async function updateAssignment(id, payload) {
  return backendClient.patch(`/assignments/${id}/`, payload);
}

export async function deleteAssignment(id) {
  return backendClient.delete(`/assignments/${id}/`);
}

export async function publishAssignment(id) {
  return backendClient.post(`/assignments/${id}/publish/`);
}

export async function reorderAssignments(moduleId, entries) {
  return backendClient.patch(`/assignments/order/${moduleId}/`, entries);
}

export async function getAssignmentAttachments(assignmentId) {
  return backendClient.get(`/assignments/${assignmentId}/attachments/`);
}

export async function uploadAssignmentAttachment(assignmentId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return backendClient.post(`/assignments/${assignmentId}/attachments/`, formData);
}

export async function updateAssignmentAttachment(id, file) {
  const formData = new FormData();
  formData.append("file", file);
  return backendClient.patch(`/assignments/attachments/${id}/`, formData);
}

export async function deleteAssignmentAttachment(id) {
  return backendClient.delete(`/assignments/attachments/${id}/`);
}
