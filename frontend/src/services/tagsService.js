import { backendClient } from "./apiClient";

export async function getTags() {
  return backendClient.get("/courses/tags/");
}
