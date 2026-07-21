import { apiClient } from "./apiClient";

/**
 * Request strategic advice from the Gemini-backed advisor API.
 */
export async function requestAdvisorAdvice({
  scenario,
  systemPrompt,
  advisorName,
}) {
  return apiClient.post("/api/advisor", {
    scenario,
    systemPrompt,
    advisorName,
  });
}
