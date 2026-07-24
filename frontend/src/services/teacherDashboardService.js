import { backendClient } from "./apiClient";

export async function getTeacherDashboardStats() {
  return backendClient.get("/dashboard/api/teacher/dashboard/stats");
}
