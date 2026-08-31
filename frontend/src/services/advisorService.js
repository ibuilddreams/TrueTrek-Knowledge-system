import { backendClient } from "./apiClient";

// A few seconds above the backend's own single-attempt Gemini timeout
// (advisor/services.py::CHAT_TIMEOUT_SECONDS = 20s) — this is a safety net for
// a genuinely hung connection, not the primary timeout; the backend already
// fails fast and returns a friendly error well before this fires in the
// normal "Gemini is just slow" case.
const ADVISOR_CHAT_TIMEOUT_MS = 30000;

/**
 * Request strategic advice from the Gemini-backed advisor API. Backed by the
 * Django backend's /api/advisor/chat/ endpoint (ai_courses' Gemini provider),
 * not the browser or a Next.js route — the GEMINI_API_KEY only ever lives
 * server-side.
 */
export async function requestAdvisorAdvice({ scenario, systemPrompt, advisorName }) {
  const response = await backendClient.post(
    "/advisor/chat/",
    { scenario, systemPrompt, advisorName },
    { timeoutMs: ADVISOR_CHAT_TIMEOUT_MS },
  );
  return response.data;
}
