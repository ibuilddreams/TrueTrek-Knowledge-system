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

export async function reorderAssignmentAttachments(assignmentId, entries) {
  return backendClient.patch(`/assignments/${assignmentId}/attachments/order/`, entries);
}

export async function getAssignmentCourseProgress(
  courseId,
  { assignment, student, status, page, pageSize = 10 } = {},
) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (page) params.set("page", page);
  if (assignment) params.set("assignment", assignment);
  if (student) params.set("student", student);
  if (status) params.set("status", status);
  return backendClient.get(`/assignments/course/${courseId}/progress/?${params.toString()}`);
}

export async function gradeAssignmentSubmission(submissionId, payload) {
  return backendClient.post(`/assignments/submissions/${submissionId}/grade/`, payload);
}

export async function submitAssignment(assignmentId, { files = [] } = {}) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return backendClient.post(`/assignments/${assignmentId}/submit/`, formData);
}

export async function getMyAssignmentSubmission(assignmentId) {
  return backendClient.get(`/assignments/${assignmentId}/my-submission/`);
}
