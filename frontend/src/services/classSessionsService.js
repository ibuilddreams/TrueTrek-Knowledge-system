import { backendClient } from "./apiClient";

// Student — the live classes on courses they're enrolled in
export async function getMyUpcomingClasses({ page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/class-sessions/my/upcoming/?${params.toString()}`);
}

export async function getMyPastClasses({ page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/class-sessions/my/past/?${params.toString()}`);
}

export async function getClassSession(id) {
  return backendClient.get(`/class-sessions/${id}/`);
}

// Both sides of the door. The Agora channel and token are released only by
// this call, and only while the room is open (class_sessions/services.py::
// issue_join_credentials) — nothing about a channel is in a listing payload.
// Safe to call again mid-class: that is how an expiring token is renewed.
export async function joinClassSession(id) {
  return backendClient.post(`/class-sessions/${id}/join/`);
}

export async function leaveClassSession(id) {
  return backendClient.post(`/class-sessions/${id}/leave/`);
}

// Teacher — scheduling
export async function getTeacherClassSessions({
  page = 1,
  pageSize = 20,
  scope,
  course,
  status,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (scope) params.set("scope", scope);
  if (course) params.set("course", course);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return backendClient.get(`/class-sessions/teacher/?${params.toString()}`);
}

export async function createClassSession(payload) {
  return backendClient.post("/class-sessions/teacher/", payload);
}

export async function updateClassSession(id, payload) {
  return backendClient.patch(`/class-sessions/teacher/${id}/`, payload);
}

// Cancels instead of deleting once a class has been taught or joined — the
// response message says which happened.
export async function deleteClassSession(id, { cancellationReason } = {}) {
  return backendClient.delete(`/class-sessions/teacher/${id}/`, {
    body: { cancellation_reason: cancellationReason || "" },
  });
}

export async function getClassSessionAttendance(id, { page = 1, pageSize = 100 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(
    `/class-sessions/teacher/${id}/attendance/?${params.toString()}`,
  );
}
