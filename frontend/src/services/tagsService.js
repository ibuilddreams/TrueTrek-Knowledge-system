import { backendClient } from "./apiClient";

export async function getTags() {
  return backendClient.get("/courses/tags/");
}

export async function createTag(payload) {
  return backendClient.post("/courses/tags/", payload);
}
