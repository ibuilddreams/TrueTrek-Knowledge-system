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

// Pass `courseIds` to check out only those cart items (e.g. "Buy now" on a
// single course) and leave the rest of the cart untouched.
export async function checkoutCart(courseIds) {
  return backendClient.post(
    "/carts/checkout/",
    courseIds ? { course_ids: courseIds } : {},
  );
}
