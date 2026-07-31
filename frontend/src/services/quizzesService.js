import { backendClient } from "./apiClient";

export async function getQuizzes({ moduleId, courseId, status, search, ordering, pageSize = 100 } = {}) {
  const params = new URLSearchParams();
  params.set("page_size", pageSize);
  if (moduleId) params.set("module", moduleId);
  if (courseId) params.set("course", courseId);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (ordering) params.set("ordering", ordering);
  return backendClient.get(`/quizzes/?${params.toString()}`);
}

export async function getQuiz(id) {
  return backendClient.get(`/quizzes/${id}/`);
}

export async function createQuiz(payload) {
  return backendClient.post("/quizzes/", payload);
}

export async function updateQuiz(id, payload) {
  return backendClient.patch(`/quizzes/${id}/`, payload);
}

export async function deleteQuiz(id) {
  return backendClient.delete(`/quizzes/${id}/`);
}

export async function publishQuiz(id) {
  return backendClient.post(`/quizzes/${id}/publish/`);
}

export async function reorderQuizzes(moduleId, entries) {
  return backendClient.patch(`/quizzes/order/${moduleId}/`, entries);
}

export async function getQuestions(quizId) {
  return backendClient.get(`/quizzes/${quizId}/questions/`);
}

export async function createQuestion(quizId, payload) {
  return backendClient.post(`/quizzes/${quizId}/questions/`, payload);
}

export async function updateQuestion(id, payload) {
  return backendClient.patch(`/quizzes/questions/${id}/`, payload);
}

export async function deleteQuestion(id) {
  return backendClient.delete(`/quizzes/questions/${id}/`);
}

export async function getChoices(questionId) {
  return backendClient.get(`/quizzes/questions/${questionId}/choices/`);
}

export async function createChoice(questionId, payload) {
  return backendClient.post(`/quizzes/questions/${questionId}/choices/`, payload);
}

export async function updateChoice(id, payload) {
  return backendClient.patch(`/quizzes/choices/${id}/`, payload);
}

export async function deleteChoice(id) {
  return backendClient.delete(`/quizzes/choices/${id}/`);
}
