import { backendClient } from "./apiClient";

// Public instructor page: profile, stats and published courses.
export async function getInstructor(instructorId) {
  return backendClient.get(`/instructors/${instructorId}/`);
}

export async function getInstructorFeedback(instructorId, { page = 1, pageSize = 12 } = {}) {
  return backendClient.get(
    `/instructors/${instructorId}/feedback/?page=${page}&page_size=${pageSize}`,
  );
}

// Courses the signed-in student may review this instructor for, with any
// feedback they've already left.
export async function getFeedbackEligibility(instructorId) {
  return backendClient.get(`/instructors/${instructorId}/feedback/eligibility/`);
}

export async function submitInstructorFeedback(instructorId, payload) {
  return backendClient.post(`/instructors/${instructorId}/feedback/`, payload);
}

export async function deleteInstructorFeedback(instructorId, courseId) {
  return backendClient.delete(`/instructors/${instructorId}/feedback/${courseId}/`);
}

// The signed-in teacher's own public profile.
export async function getMyInstructorProfile() {
  return backendClient.get("/instructors/me/profile/");
}

export async function updateMyInstructorProfile(payload) {
  return backendClient.patch("/instructors/me/profile/", payload);
}

export async function getMyInstructorFeedback({ page = 1, pageSize = 10 } = {}) {
  return backendClient.get(`/instructors/me/feedback/?page=${page}&page_size=${pageSize}`);
}

// Feedback left for a published course's instructors, plus the course's overall
// rating (`summary`) — shown under the instructors on the course page.
export async function getCourseFeedback(courseSlug, { page = 1, pageSize = 6 } = {}) {
  return backendClient.get(
    `/instructors/course/${encodeURIComponent(courseSlug)}/feedback/?page=${page}&page_size=${pageSize}`,
  );
}
