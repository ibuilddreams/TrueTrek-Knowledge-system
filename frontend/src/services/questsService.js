import { backendClient } from "./apiClient";

// Student — daily quest board
export async function getTodaysQuests() {
  return backendClient.get("/quests/today/");
}

export async function getQuestStats() {
  return backendClient.get("/quests/stats/");
}

export async function getQuestHistory({ page = 1, pageSize = 10, status } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (status) params.set("status", status);
  return backendClient.get(`/quests/history/?${params.toString()}`);
}

// Completion accepts an optional proof file, so it goes up as multipart
// whenever one is attached and as plain JSON otherwise — the backend view
// accepts both (JSONParser + MultiPartParser).
export async function completeQuest(assignmentId, { reflection, proofUrl, proofFile } = {}) {
  if (proofFile) {
    const formData = new FormData();
    if (reflection) formData.append("reflection", reflection);
    if (proofUrl) formData.append("proof_url", proofUrl);
    formData.append("proof_file", proofFile);
    return backendClient.post(`/quests/assignments/${assignmentId}/complete/`, formData);
  }

  const payload = {};
  if (reflection) payload.reflection = reflection;
  if (proofUrl) payload.proof_url = proofUrl;
  return backendClient.post(`/quests/assignments/${assignmentId}/complete/`, payload);
}

export async function skipQuest(assignmentId) {
  return backendClient.post(`/quests/assignments/${assignmentId}/skip/`);
}

// Admin — catalog health (see quests/views.py::AdminQuestStatsView)
export async function getAdminQuestStats() {
  return backendClient.get("/quests/admin/stats/");
}

// Admin — student submissions ("who completed which quest")
export async function getAdminQuestSubmissions({
  page = 1,
  pageSize = 10,
  search,
  status,
  quest,
  student,
  dateFrom,
  dateTo,
  hasProof,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (quest) params.set("quest", quest);
  if (student) params.set("student", student);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  if (hasProof) params.set("has_proof", "true");
  return backendClient.get(`/quests/admin/submissions/?${params.toString()}`);
}

// Admin — quest catalog management
export async function getAdminQuests({
  page = 1,
  pageSize = 10,
  search,
  status,
  category,
  difficulty,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (difficulty) params.set("difficulty", difficulty);
  return backendClient.get(`/quests/?${params.toString()}`);
}

export async function createQuest(payload) {
  return backendClient.post("/quests/", payload);
}

export async function updateQuest(id, payload) {
  return backendClient.patch(`/quests/${id}/`, payload);
}

export async function deleteQuest(id) {
  return backendClient.delete(`/quests/${id}/`);
}
