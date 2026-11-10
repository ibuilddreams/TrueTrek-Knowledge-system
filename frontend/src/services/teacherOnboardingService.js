import { backendClient } from "./apiClient";

/**
 * Teacher onboarding — the application a self-signed-up teacher completes and
 * an admin reviews.
 *
 * `getTeacherOnboardingStatus` is the only call any signed-in user may make:
 * it answers "does this account need an approved application, and has it got
 * one", and is what the teacher portal gates on. Everything under `/me/` is
 * the applicant's own, and everything under `/admin/` is the review queue.
 */

export async function getTeacherOnboardingStatus() {
  return backendClient.get("/teacher-onboarding/status/");
}

// --- The teacher's own application ---

export async function getMyTeacherApplication() {
  return backendClient.get("/teacher-onboarding/me/");
}

export async function updateMyTeacherApplication(payload) {
  return backendClient.patch("/teacher-onboarding/me/", payload);
}

/**
 * Saves the intro-video step, which may carry a file and therefore has to go
 * as multipart.
 *
 * `fields` takes scalars only — a multipart part is a string, so a list field
 * such as `expertise` would arrive at DRF as one, which is why every other
 * step saves as JSON through `updateMyTeacherApplication` above.
 */
export async function updateMyTeacherApplicationVideo({ file, remove, fields = {} } = {}) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });
  if (file) formData.append("intro_video", file);
  if (remove) formData.append("remove_intro_video", "true");
  return backendClient.patch("/teacher-onboarding/me/", formData);
}

export async function submitMyTeacherApplication() {
  return backendClient.post("/teacher-onboarding/me/submit/", {});
}

export async function uploadTeacherCredential({
  file,
  credentialType,
  title,
  institution,
  yearAwarded,
}) {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("credential_type", credentialType);
  formData.append("title", title);
  if (institution) formData.append("institution", institution);
  if (yearAwarded) formData.append("year_awarded", yearAwarded);
  return backendClient.post("/teacher-onboarding/me/credentials/", formData);
}

export async function deleteTeacherCredential(id) {
  return backendClient.delete(`/teacher-onboarding/me/credentials/${id}/`);
}

// --- Admin review queue ---

export async function getAdminTeacherApplications({
  page = 1,
  pageSize = 10,
  status,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return backendClient.get(`/teacher-onboarding/admin/?${params.toString()}`);
}

export async function getAdminTeacherApplicationSummary() {
  return backendClient.get("/teacher-onboarding/admin/summary/");
}

export async function getAdminTeacherApplication(id) {
  return backendClient.get(`/teacher-onboarding/admin/${id}/`);
}

export async function reviewTeacherApplication(id, { status, reviewNotes }) {
  return backendClient.patch(`/teacher-onboarding/admin/${id}/`, {
    status,
    review_notes: reviewNotes || "",
  });
}
