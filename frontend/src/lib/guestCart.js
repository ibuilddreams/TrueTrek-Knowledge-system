// Browser-persisted cart for visitors who aren't signed in — merged into the
// server cart by GuestCartSync when they sign in as a student.
import { createGuestCourseStore } from "./guestCourseStore";

const store = createGuestCourseStore("truetrek-guest-cart");

export const getGuestCartSnapshot = store.getSnapshot;
export const getGuestCartServerSnapshot = store.getServerSnapshot;
export const subscribeGuestCart = store.subscribe;
export const addToGuestCart = store.add;
export const removeFromGuestCart = store.remove;
export const clearGuestCart = store.clear;
