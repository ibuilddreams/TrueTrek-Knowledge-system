import { backendClient } from "./apiClient";

export async function getProfile() {
  return backendClient.get("/user/profile/");
}

export async function updateProfile(payload) {
  return backendClient.patch("/user/profile/", payload);
}
