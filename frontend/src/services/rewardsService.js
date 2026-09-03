import { backendClient } from "./apiClient";

// Admin — reward catalog management
export async function getAdminRewards({ pageSize = 100, search, status } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return backendClient.get(`/rewards/?${params.toString()}`);
}

export async function getRewardById(id) {
  return backendClient.get(`/rewards/${id}/`);
}

export async function createReward(payload) {
  return backendClient.post("/rewards/", payload);
}

export async function updateReward(id, payload) {
  return backendClient.patch(`/rewards/${id}/`, payload);
}

export async function activateReward(id) {
  return backendClient.post(`/rewards/${id}/activate/`);
}

export async function deactivateReward(id) {
  return backendClient.post(`/rewards/${id}/deactivate/`);
}

// Student — catalog browsing & redemption
export async function getRewardsCatalog() {
  return backendClient.get("/rewards/catalog/");
}

export async function redeemReward(id, studentNote) {
  return backendClient.post(`/rewards/${id}/redeem/`, studentNote ? { student_note: studentNote } : {});
}

export async function getMyRedemptions({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/rewards/my/redemptions/?${params.toString()}`);
}

// Admin — redemption management
export async function getAdminRedemptions({ page = 1, pageSize = 10, status, student } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (status) params.set("status", status);
  if (student) params.set("student", student);
  return backendClient.get(`/rewards/admin/redemptions/?${params.toString()}`);
}

export async function processRedemption(id, payload) {
  return backendClient.patch(`/rewards/admin/redemptions/${id}/`, payload);
}

export async function scheduleRedemption(id, payload) {
  return backendClient.patch(`/rewards/admin/redemptions/${id}/schedule/`, payload);
}
