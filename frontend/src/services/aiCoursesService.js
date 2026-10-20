import { backendClient } from "./apiClient";

export async function startCourseGeneration(payload) {
  return backendClient.post("/ai-courses/generations/", payload);
}

export async function getCourseGeneration(jobId) {
  return backendClient.get(`/ai-courses/generations/${jobId}/`);
}

// The generation this admin should be offered back on Admin -> Courses: the one
// still running, or the one that just finished. `data` is null when there is
// nothing to resume. This is what makes closing the wizard safe — the job id it
// held is gone on a tab switch or a reload, but the generation is not.
export async function getLatestCourseGeneration() {
  return backendClient.get("/ai-courses/generations/latest/");
}

export async function cancelCourseGeneration(jobId) {
  return backendClient.post(`/ai-courses/generations/${jobId}/cancel/`);
}

export async function retryCourseGeneration(jobId) {
  return backendClient.post(`/ai-courses/generations/${jobId}/retry/`);
}

export async function listCourseGenerations({ pageSize = 10, page } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (page) params.set("page", page);
  return backendClient.get(`/ai-courses/generations/?${params.toString()}`);
}

export async function getAiCourseGenerationUsage() {
  return backendClient.get("/ai-courses/usage/");
}
