import { backendClient } from "./apiClient";

export async function getStudentDashboardStats() {
  return backendClient.get("/dashboard/api/student/dashboard/stats");
}
