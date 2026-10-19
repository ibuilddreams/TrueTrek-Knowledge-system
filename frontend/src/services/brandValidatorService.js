import { backendClient } from "./apiClient";

export async function uploadMediaKit({ file, athleteContext } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (athleteContext) formData.append("athlete_context", athleteContext);
  return backendClient.post("/brand-validator/reviews/", formData);
}

export async function getMediaKitReview(id) {
  return backendClient.get(`/brand-validator/reviews/${id}/`);
}

export async function getLatestMediaKitReview() {
  return backendClient.get("/brand-validator/reviews/latest/");
}

export async function getMediaKitReviews({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", pageSize);
  return backendClient.get(`/brand-validator/reviews/?${params.toString()}`);
}

export async function deleteMediaKitReview(id) {
  return backendClient.delete(`/brand-validator/reviews/${id}/`);
}
