import { backendClient } from "./apiClient";

export async function getAdminDashboardStatistics() {
  return backendClient.get("/dashboard/admin/statistics/");
}

export async function getAdminDashboardActivityProgress() {
  return backendClient.get("/dashboard/admin/activity-progress/");
}

export async function getAdminDashboardCharts() {
  return backendClient.get("/dashboard/admin/charts/");
}
