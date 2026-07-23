import { backendClient } from "./apiClient";

export async function getDashboardOverview() {
  return backendClient.get("/dashboard/overview");
}
