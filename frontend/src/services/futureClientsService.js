import { backendClient } from "./apiClient";

export async function submitFutureClientApplication(payload) {
  return backendClient.post("/future-clients/apply/", payload);
}

export async function getFutureClientApplications({ pageSize = 100 } = {}) {
  return backendClient.get(`/future-clients/admin/?page_size=${pageSize}`);
}

export async function getFutureClientApplication(id) {
  return backendClient.get(`/future-clients/admin/${id}/`);
}

export async function approveFutureClientApplication(id) {
  return backendClient.post(`/future-clients/admin/${id}/approve/`);
}

export async function rejectFutureClientApplication(id, rejectionReason) {
  return backendClient.post(`/future-clients/admin/${id}/reject/`, {
    rejection_reason: rejectionReason,
  });
}
