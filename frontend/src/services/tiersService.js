import { backendClient } from "./apiClient";

export async function getPublicTiers({ page = 1, pageSize = 100, search } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  return backendClient.get(`/tiers/public/?${params.toString()}`);
}

export async function getPublicTierById(id) {
  return backendClient.get(`/tiers/public/${id}/`);
}

export async function getAdminTiers({ pageSize = 100, search, status } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return backendClient.get(`/tiers/?${params.toString()}`);
}

export async function getTierById(id) {
  return backendClient.get(`/tiers/${id}/`);
}

export async function createTier(payload) {
  return backendClient.post("/tiers/", payload);
}

export async function updateTier(id, payload) {
  return backendClient.patch(`/tiers/${id}/`, payload);
}

export async function deleteTier(id) {
  return backendClient.delete(`/tiers/${id}/`);
}

export async function reorderTiers(entries) {
  return backendClient.patch("/tiers/order/", entries);
}

export async function getMyTierProgress() {
  return backendClient.get("/tiers/mine/");
}

export async function getTierProgressDetail(id) {
  return backendClient.get(`/tiers/${id}/progress/`);
}

export async function attachPathwayToTier(tierId, pathwayId) {
  return backendClient.post(`/tiers/${tierId}/pathways/`, { pathway: pathwayId });
}

export async function detachPathwayFromTier(tierId, pathwayId) {
  return backendClient.delete(`/tiers/${tierId}/pathways/${pathwayId}/`);
}

export async function reorderTierPathways(tierId, entries) {
  return backendClient.patch(`/tiers/${tierId}/pathways/order/`, entries);
}
