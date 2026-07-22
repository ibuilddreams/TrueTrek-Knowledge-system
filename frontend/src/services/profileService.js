import { backendClient } from "./apiClient";

export async function getProfile() {
  return backendClient.get("/users/profile/");
}

export async function updateProfile(payload) {
  return backendClient.patch("/users/profile/", payload);
}
