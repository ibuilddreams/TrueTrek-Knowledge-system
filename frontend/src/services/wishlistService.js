import { backendClient } from "./apiClient";

export async function getWishlist() {
  return backendClient.get("/wishlists/");
}

export async function addToWishlist(courseId) {
  return backendClient.post("/wishlists/", { course: courseId });
}

export async function removeFromWishlist(courseId) {
  return backendClient.delete(`/wishlists/${courseId}/`);
}
