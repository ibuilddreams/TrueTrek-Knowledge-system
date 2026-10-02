// Browser-persisted wishlist for visitors who aren't signed in — merged into
// the server wishlist by GuestWishlistSync when they sign in as a student.
import { createGuestCourseStore } from "./guestCourseStore";

const store = createGuestCourseStore("truetrek-guest-wishlist");

export const getGuestWishlistSnapshot = store.getSnapshot;
export const getGuestWishlistServerSnapshot = store.getServerSnapshot;
export const subscribeGuestWishlist = store.subscribe;
export const addToGuestWishlist = store.add;
export const removeFromGuestWishlist = store.remove;
export const clearGuestWishlist = store.clear;
