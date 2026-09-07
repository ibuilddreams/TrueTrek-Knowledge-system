import { backendClient } from "./apiClient";

export async function getNotifications({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/notifications/?${params.toString()}`);
}

export async function getUnreadNotificationsCount() {
  return backendClient.get("/notifications/unread-count/");
}

export async function markNotificationRead(id) {
  return backendClient.patch(`/notifications/${id}/read/`);
}

export async function markAllNotificationsRead() {
  return backendClient.patch("/notifications/mark-all-read/");
}
