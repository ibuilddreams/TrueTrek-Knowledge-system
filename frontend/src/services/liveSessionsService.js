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

// Both sides of the door for a session hosted *here*. The Agora channel and
// token are released only by this call, and only while the room is open
// (live_sessions/services.py::issue_join_credentials) — nothing about a
// channel is in any listing payload.
//
// Safe to call again mid-session, and that is how two different things are
// done: Agora's "your token is about to expire" warning, and picking up a
// token with different speaking rights after a host opens or closes the floor.
export async function joinSessionRoom(id) {
  return backendClient.post(`/live-sessions/${id}/room/`);
}

// Host-only — opens the floor to everyone in the room, or takes it back.
// `access` is "LISTEN_ONLY" or "EVERYONE"; the updated session comes back.
//
// It is a saved setting rather than a message to the room because it decides
// the role inside every token the room mints: a student who joins ten minutes
// after the floor opened has to arrive able to speak.
export async function setSessionAudienceAccess(id, access) {
  return backendClient.patch(`/live-sessions/${id}/room/`, {
    audience_access: access,
  });
}

// `ended` is the browser saying this was a deliberate exit — the red button,
// or the room closing itself at the advertised end — rather than a reload, a
// navigation or a dropped connection, which look identical from the server.
// Only a deliberate exit writes the notes up; an ambiguous one parks them so
// the rejoin a moment later carries on.
export async function leaveSessionRoom(id, { ended = false } = {}) {
  return backendClient.post(`/live-sessions/${id}/leave/`, { ended });
}

// The session's AI meeting notes.
//
// This GET doubles as the room's "taking notes" indicator while a session is
// running, so it is cheap on purpose and safe to poll. Once the notes are
// written it carries them in full — and, for a host only, the verbatim
// transcript they were written from.
export async function getSessionNotes(id) {
  return backendClient.get(`/live-sessions/${id}/notes/`);
}

// Host-only. Starting is also automatic the moment a host opens the room
// (live_sessions/notes.py::maybe_start_notes); this is the button for a
// session where the notes were stopped and are wanted again.
export async function startSessionNotes(id) {
  return backendClient.post(`/live-sessions/${id}/notes/`);
}

// Host-only, and deliberately a **pause**: what has been recorded stays on
// the run, pressing start again resumes it, and the write-up happens when the
// session ends. One session taken in two stretches comes out as one set of
// notes.
export async function stopSessionNotes(id) {
  return backendClient.delete(`/live-sessions/${id}/notes/`);
}

// The file extension for a recorded blob's media type. The browser puts the
// type in the part's own header, so this is belt and braces — but a file
// called `.webm` that is actually MP4 is a confusing thing to find on a
// server months later, and the extension is what the stored name keeps.
function audioExtension(mimeType) {
  const base = String(mimeType || "").split(";")[0].trim().toLowerCase();
  if (base === "audio/mp4" || base === "audio/x-m4a") return "m4a";
  if (base === "audio/ogg" || base === "audio/opus") return "ogg";
  if (base === "audio/wav" || base === "audio/x-wav") return "wav";
  return "webm";
}

// One segment of the room's own audio, on its way to becoming the notes.
//
// There is no transcription service and no bucket in this path at all: the
// host's browser mixes everybody who is speaking, records the session in
// slices and posts them here while it is still running. They land in this
// project's own media folder and the AI model reads them from there.
//
// Host-only, and narrower still — the server accepts segments from exactly
// one browser per session. Safe to send twice: `client_key` is what makes a
// retried upload one segment rather than two.
//
// `end` is the browser saying "the session is over" — the room closing or the
// host leaving — and is what actually starts the write-up. Pressing stop does
// NOT set it: that is a pause, and the segment it sends is simply the last of
// that stretch.
export async function uploadSessionNotesAudio(
  id,
  { blob, clientKey, durationSeconds, end = false, speakers } = {},
) {
  const form = new FormData();
  form.append("audio", blob, `live-${id}-${clientKey}.${audioExtension(blob?.type)}`);
  form.append("client_key", clientKey);
  if (durationSeconds != null) form.append("duration_seconds", String(durationSeconds));
  form.append("end", end ? "true" : "false");
  // Who was speaking and when, measured from the individual tracks before
  // they were mixed. The server resolves the uids against the room's roster;
  // it is what puts a name in front of a line instead of "Speaker".
  if (speakers?.length) form.append("speakers", JSON.stringify(speakers));
  return backendClient.post(`/live-sessions/${id}/notes/audio/`, form);
}

// The notes as a PDF. Streamed through the API behind the same check as the
// room itself rather than served from a MEDIA path, so there is never a URL
// to the document that outlives the check.
export async function downloadSessionNotesDocument(id) {
  return backendClient.get(`/live-sessions/${id}/notes/document/`, {
    responseType: "blob",
  });
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
