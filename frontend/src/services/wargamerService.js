import { backendClient } from "./apiClient";

// The two AI-backed calls run synchronously on the Django side (see
// wargamer/services.py — a role-play turn is a live conversation, not a
// backgrounded job), so both get their own ceiling a few seconds above the
// backend's. This is a safety net for a genuinely hung connection, not the
// primary timeout: the backend already fails fast with a friendly message.
const ROLEPLAY_TURN_TIMEOUT_MS = 35000;
const ROLEPLAY_EVALUATION_TIMEOUT_MS = 50000;

// --- Student — the LS-302 role-play module --------------------------------

export async function getRolePlayScenarios() {
  return backendClient.get("/wargamer/scenarios/");
}

export async function getRolePlayStats() {
  return backendClient.get("/wargamer/stats/");
}

export async function startRolePlaySession(scenarioId) {
  return backendClient.post("/wargamer/sessions/start/", { scenario_id: scenarioId });
}

export async function getRolePlaySession(id) {
  return backendClient.get(`/wargamer/sessions/${id}/`);
}

export async function sendRolePlayReply(id, message) {
  return backendClient.post(
    `/wargamer/sessions/${id}/reply/`,
    { message },
    { timeoutMs: ROLEPLAY_TURN_TIMEOUT_MS },
  );
}

export async function evaluateRolePlaySession(id) {
  return backendClient.post(
    `/wargamer/sessions/${id}/evaluate/`,
    {},
    { timeoutMs: ROLEPLAY_EVALUATION_TIMEOUT_MS },
  );
}

export async function abandonRolePlaySession(id) {
  return backendClient.post(`/wargamer/sessions/${id}/abandon/`, {});
}

export async function getRolePlayHistory({ page = 1, pageSize = 10, status, scenario } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (status) params.set("status", status);
  if (scenario) params.set("scenario", scenario);
  return backendClient.get(`/wargamer/sessions/?${params.toString()}`);
}

// --- Admin — scenario catalog ---------------------------------------------

export async function getAdminRolePlayStats() {
  return backendClient.get("/wargamer/admin/stats/");
}

export async function getAdminRolePlayScenarios({
  page = 1,
  pageSize = 10,
  search,
  status,
  relationship,
  pressureType,
  persona,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (relationship) params.set("relationship", relationship);
  if (pressureType) params.set("pressure_type", pressureType);
  if (persona) params.set("persona", persona);
  return backendClient.get(`/wargamer/admin/scenarios/?${params.toString()}`);
}

export async function createRolePlayScenario(payload) {
  return backendClient.post("/wargamer/admin/scenarios/", payload);
}

export async function updateRolePlayScenario(id, payload) {
  return backendClient.patch(`/wargamer/admin/scenarios/${id}/`, payload);
}

export async function deleteRolePlayScenario(id) {
  return backendClient.delete(`/wargamer/admin/scenarios/${id}/`);
}

// --- Admin — read-only activity feed --------------------------------------

export async function getAdminRolePlaySessions({
  page = 1,
  pageSize = 10,
  search,
  status,
  scenario,
  student,
  passed,
  dateFrom,
  dateTo,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (scenario) params.set("scenario", scenario);
  if (student) params.set("student", student);
  if (passed) params.set("passed", passed);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  return backendClient.get(`/wargamer/admin/sessions/?${params.toString()}`);
}

export async function getAdminRolePlaySession(id) {
  return backendClient.get(`/wargamer/admin/sessions/${id}/`);
}
