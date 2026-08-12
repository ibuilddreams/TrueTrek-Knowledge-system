import { backendClient } from "./apiClient";

export async function getCart() {
  return backendClient.get("/carts/");
}

export async function addToCart(courseId) {
  return backendClient.post("/carts/", { course: courseId });
}

export async function removeFromCart(courseId) {
  return backendClient.delete(`/carts/${courseId}/`);
}

export async function checkoutCart() {
  return backendClient.post("/carts/checkout/", {});
}
