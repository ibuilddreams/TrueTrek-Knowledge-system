import { backendClient } from "./apiClient";

// Student — today's Daily Drill (backend resolves admin-scheduled / AI / legacy)
export async function getTodaysDrill() {
  return backendClient.get("/daily-drill/today/");
}

export async function submitDrillAttempt(answerKey) {
  return backendClient.post("/daily-drill/attempt/", { answer_key: answerKey });
}

export async function recordVideoProgress(scheduleId, progressPercent) {
  return backendClient.post(`/daily-drill/${scheduleId}/video-progress/`, {
    progress_percent: progressPercent,
  });
}

export async function submitAdminDrillQuiz(scheduleId, answers) {
  return backendClient.post(`/daily-drill/${scheduleId}/submit/`, { answers });
}

// Admin — Daily Drill schedule management
export async function getAdminDrillSchedules({ pageSize = 100, search, status } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return backendClient.get(`/daily-drill/admin/schedules/?${params.toString()}`);
}

export async function getAdminDrillSchedule(id) {
  return backendClient.get(`/daily-drill/admin/schedules/${id}/`);
}

export async function createAdminDrillSchedule(formData) {
  return backendClient.post("/daily-drill/admin/schedules/", formData);
}

export async function updateAdminDrillSchedule(id, formData) {
  return backendClient.patch(`/daily-drill/admin/schedules/${id}/`, formData);
}

export async function saveAdminDrillQuiz(id, questions) {
  return backendClient.put(`/daily-drill/admin/schedules/${id}/quiz/`, { questions });
}

export async function activateAdminDrillSchedule(id) {
  return backendClient.post(`/daily-drill/admin/schedules/${id}/activate/`);
}

export async function deactivateAdminDrillSchedule(id) {
  return backendClient.post(`/daily-drill/admin/schedules/${id}/deactivate/`);
}

export async function getAdminDrillSchedulePerformance(id) {
  return backendClient.get(`/daily-drill/admin/schedules/${id}/performance/`);
}
