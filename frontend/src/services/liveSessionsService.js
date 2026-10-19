import { backendClient } from "./apiClient";

// Student — session discovery
export async function getUpcomingSessions({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/live-sessions/upcoming/?${params.toString()}`);
}

export async function getPastSessions({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/live-sessions/past/?${params.toString()}`);
}

export async function getSessionStats() {
  return backendClient.get("/live-sessions/stats/");
}

export async function getSession(id) {
  return backendClient.get(`/live-sessions/${id}/`);
}

export async function rsvpToSession(id) {
  return backendClient.post(`/live-sessions/${id}/rsvp/`);
}

export async function cancelSessionRsvp(id) {
  return backendClient.delete(`/live-sessions/${id}/rsvp/`);
}

// The meeting link is only released once the room is open — this 403s before
// then, by design (see live_sessions/services.py::get_join_url).
export async function getSessionJoinLink(id) {
  return backendClient.get(`/live-sessions/${id}/join/`);
}

// Speakers — GET is student-visible, writes are admin-only
export async function getSpeakers({ page = 1, pageSize = 100, search, activeOnly } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (activeOnly) params.set("active", "true");
  return backendClient.get(`/live-sessions/speakers/?${params.toString()}`);
}

export async function createSpeaker(payload) {
  return backendClient.post("/live-sessions/speakers/", payload);
}

export async function updateSpeaker(id, payload) {
  return backendClient.patch(`/live-sessions/speakers/${id}/`, payload);
}

export async function deleteSpeaker(id) {
  return backendClient.delete(`/live-sessions/speakers/${id}/`);
}

// Admin — session scheduling
export async function getAdminSessions({ page = 1, pageSize = 10, search, status } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return backendClient.get(`/live-sessions/admin/sessions/?${params.toString()}`);
}

export async function createSession(payload) {
  return backendClient.post("/live-sessions/admin/sessions/", payload);
}

export async function updateSession(id, payload) {
  return backendClient.patch(`/live-sessions/admin/sessions/${id}/`, payload);
}

export async function deleteSession(id) {
  return backendClient.delete(`/live-sessions/admin/sessions/${id}/`);
}

export async function getSessionAttendees(id, { page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/live-sessions/admin/sessions/${id}/attendees/?${params.toString()}`);
}
