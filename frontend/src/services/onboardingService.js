import { backendClient } from "./apiClient";

export async function getAdminQuestions() {
  return backendClient.get("/onboarding/admin/questions/");
}

export async function createQuestion(payload) {
  return backendClient.post("/onboarding/admin/questions/", payload);
}

export async function updateQuestion(id, payload) {
  return backendClient.patch(`/onboarding/admin/questions/${id}/`, payload);
}

export async function deleteQuestion(id) {
  return backendClient.delete(`/onboarding/admin/questions/${id}/`);
}

export async function getQuestionnaireQuestions() {
  return backendClient.get("/onboarding/questions/");
}

export async function submitQuestionnaireAnswers(answers) {
  return backendClient.post("/onboarding/answers/", { answers });
}

export async function getPathwayRecommendations() {
  return backendClient.get("/onboarding/recommendations/");
}

// Lets the onboarding wizard resume exactly where the user left off across a
// refresh, a closed browser, or logging in again — see OnboardingWizard.jsx.
export async function getOnboardingProgress() {
  return backendClient.get("/onboarding/progress/");
}

export async function saveOnboardingProgress({ step, selectedPathwayIds }) {
  return backendClient.put("/onboarding/progress/", {
    step,
    selected_pathway_ids: selectedPathwayIds,
  });
}

export async function clearOnboardingProgress() {
  return backendClient.delete("/onboarding/progress/");
}
