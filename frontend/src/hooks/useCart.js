"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { addToCart, getCart, removeFromCart } from "@/services/cartService";
import {
  addToGuestCart,
  getGuestCartServerSnapshot,
  getGuestCartSnapshot,
  removeFromGuestCart,
  subscribeGuestCart,
} from "@/lib/guestCart";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";

export const CART_QUERY_KEY = ["store-cart"];

// One cart API for every screen (navbar badge, store, curriculum, /cart page).
// - Guests: courses live in the browser (lib/guestCart) and are merged into
//   the server cart by GuestCartSync when they sign in as a student.
// - Students: the server-persisted cart, via TanStack Query.
// - Teachers/admins: no cart; add attempts are politely refused.
export function useCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isStudent } = useAuth();

  const guestItems = useSyncExternalStore(
    subscribeGuestCart,
    getGuestCartSnapshot,
    getGuestCartServerSnapshot,
  );

  const isGuest = !isAuthenticated;
  const isServerCart = isAuthenticated && isStudent;

  const { data: serverItems = [], isLoading } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => {
      const response = await getCart();
      return response?.data || [];
    },
    enabled: isServerCart,
  });

  const courses = useMemo(
    () => (isServerCart ? serverItems.map((item) => item.course) : isGuest ? guestItems : []),
    [isServerCart, isGuest, serverItems, guestItems],
  );
  const cartIds = useMemo(() => new Set(courses.map((course) => course.id)), [courses]);

  const addMutation = useMutation({
    mutationFn: (course) => addToCart(course.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toastSuccess("Added to your cart.");
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to add this course to your cart."));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (courseId) => removeFromCart(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to remove this course from your cart."));
    },
  });

  const isInCart = useCallback((courseId) => cartIds.has(courseId), [cartIds]);

  const addCourse = useCallback(
    (course) => {
      if (isGuest) {
        addToGuestCart(course);
        toastSuccess("Added to your cart.");
      } else if (isStudent) {
        addMutation.mutate(course);
      } else {
        toastInfo("Only student accounts can add courses to their cart.");
      }
    },
    [isGuest, isStudent, addMutation],
  );

  const removeCourse = useCallback(
    (courseId) => {
      if (isGuest) {
        removeFromGuestCart(courseId);
      } else if (isStudent) {
        removeMutation.mutate(courseId);
      }
    },
    [isGuest, isStudent, removeMutation],
  );

  const toggleCourse = useCallback(
    (course) => (cartIds.has(course.id) ? removeCourse(course.id) : addCourse(course)),
    [cartIds, addCourse, removeCourse],
  );

  // True while a server add/remove for this course is in flight.
  const isPending = useCallback(
    (courseId) =>
      (addMutation.isPending && addMutation.variables?.id === courseId) ||
      (removeMutation.isPending && removeMutation.variables === courseId),
    [addMutation.isPending, addMutation.variables, removeMutation.isPending, removeMutation.variables],
  );

  return {
    courses,
    count: courses.length,
    isLoading: isServerCart && isLoading,
    isGuest,
    isInCart,
    isPending,
    addCourse,
    removeCourse,
    toggleCourse,
  };
}
