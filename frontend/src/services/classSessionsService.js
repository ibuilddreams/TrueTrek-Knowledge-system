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

// The classroom whiteboard (Agora Interactive Whiteboard). Like joining the
// call, this is the only thing that releases a room uuid and a token, and only
// while the class is open (class_sessions/services.py::
// issue_whiteboard_credentials). The class's board is created on the first
// call, so it is also what "open the whiteboard" means.
//
// Safe to call again mid-class: it never creates a second room and never
// touches the register. That is how a student picks up a writer's token after
// the teacher opens the board up to everyone.
export async function openClassWhiteboard(id) {
  return backendClient.post(`/class-sessions/${id}/whiteboard/`);
}

// Teacher-only — hands the pen to the class, or takes it back.
// `access` is "HOST_ONLY" or "EVERYONE"; the updated class comes back.
export async function setClassWhiteboardAccess(id, access) {
  return backendClient.patch(`/class-sessions/${id}/whiteboard/`, {
    whiteboard_access: access,
  });
}

// The class's recording (Agora Cloud Recording → a bucket we own).
//
// This GET is the only thing that ever releases a playback link, and the link
// it returns is signed for a few hours and never stored
// (class_sessions/services.py::recording_playback_url) — a recording is as
// private as the class it is of, which is why "Watch recording" asks for a
// fresh one on every click rather than caching a URL.
//
// It doubles as the classroom's REC indicator while a class is running, so it
// is cheap on purpose and safe to poll.
export async function getClassRecording(id) {
  return backendClient.get(`/class-sessions/${id}/recording/`);
}

// Teacher-only. Starting is also automatic the moment the host opens the room
// (class_sessions/services.py::maybe_start_recording); this is the button for
// a class where it was stopped and is wanted again.
export async function startClassRecording(id) {
  return backendClient.post(`/class-sessions/${id}/recording/`);
}

// Teacher-only. Deliberately not instant: the server marks the recording as
// processing and finishes it on its own thread, which is also what notifies
// the class once the file has landed.
export async function stopClassRecording(id) {
  return backendClient.delete(`/class-sessions/${id}/recording/`);
}

// The class's AI meeting notes (Agora Real-Time Transcription → a bucket we
// own → the AI provider).
//
// A separate feature from the recording above, on a separate Agora product
// and a separate per-class switch: a class can be written up without ever
// being filmed, and either one can be unavailable on a server while the other
// works. That is why these are their own endpoints rather than fields on the
// recording's.
//
// This GET doubles as the classroom's "taking notes" indicator while a class
// is running, so it is cheap on purpose and safe to poll. Once the notes are
// written it carries them in full — and, for a teacher only, the verbatim
// transcript they were written from.
export async function getClassNotes(id) {
  return backendClient.get(`/class-sessions/${id}/notes/`);
}

// Teacher-only. Starting is also automatic the moment the host opens the room
// (class_sessions/services.py::maybe_start_notes); this is the button for a
// class where notes were stopped and are wanted again.
export async function startClassNotes(id) {
  return backendClient.post(`/class-sessions/${id}/notes/`);
}

// Teacher-only. Deliberately not instant: the server pulls the transcription
// bot out, waits for the last caption slice to land, writes the class up on
// its own thread and notifies everyone when it is done.
export async function stopClassNotes(id) {
  return backendClient.delete(`/class-sessions/${id}/notes/`);
}

// The notes as a PDF. Streamed through the API behind the same roster check
// as the classroom door rather than served from a MEDIA path, so there is
// never a URL to the document that outlives the check — the same rule that
// keeps a recording's bucket private, by a different mechanism because this
// file is one we rendered ourselves.
export async function downloadClassNotesDocument(id) {
  return backendClient.get(`/class-sessions/${id}/notes/document/`, {
    responseType: "blob",
  });
}
