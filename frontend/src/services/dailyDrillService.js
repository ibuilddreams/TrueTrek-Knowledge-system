import { backendClient } from "./apiClient";

export async function getTodaysDrill() {
  return backendClient.get("/daily-drill/today/");
}

export async function submitDrillAttempt(optionId) {
  return backendClient.post("/daily-drill/attempt/", { option_id: optionId });
}
