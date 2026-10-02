"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { addToWishlist, getWishlist, removeFromWishlist } from "@/services/wishlistService";
import {
  addToGuestWishlist,
  getGuestWishlistServerSnapshot,
  getGuestWishlistSnapshot,
  removeFromGuestWishlist,
  subscribeGuestWishlist,
} from "@/lib/guestWishlist";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";

export const WISHLIST_QUERY_KEY = ["store-wishlist"];

// One wishlist API for every screen (navbar badge, store, cart, /wishlist).
// - Guests: courses live in the browser (lib/guestWishlist) and are merged
//   into the server wishlist by GuestWishlistSync when they sign in as a student.
// - Students: the server-persisted wishlist, via TanStack Query.
// - Teachers/admins: no wishlist; add attempts are politely refused.
export function useWishlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isStudent } = useAuth();

  const guestItems = useSyncExternalStore(
    subscribeGuestWishlist,
    getGuestWishlistSnapshot,
    getGuestWishlistServerSnapshot,
  );

  const isGuest = !isAuthenticated;
  const isServerWishlist = isAuthenticated && isStudent;

  const { data: serverItems = [], isLoading } = useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: async () => {
      const response = await getWishlist();
      return response?.data || [];
    },
    enabled: isServerWishlist,
  });

  const courses = useMemo(
    () => (isServerWishlist ? serverItems.map((item) => item.course) : isGuest ? guestItems : []),
    [isServerWishlist, isGuest, serverItems, guestItems],
  );
  const wishlistIds = useMemo(() => new Set(courses.map((course) => course.id)), [courses]);

  const addMutation = useMutation({
    mutationFn: (courseId) => addToWishlist(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to add this course to your wishlist."));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (courseId) => removeFromWishlist(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to remove this course from your wishlist."));
    },
  });

  const isInWishlist = useCallback((courseId) => wishlistIds.has(courseId), [wishlistIds]);

  // True while a server add/remove for this course is in flight.
  const isPending = useCallback(
    (courseId) =>
      (addMutation.isPending && addMutation.variables === courseId) ||
      (removeMutation.isPending && removeMutation.variables === courseId),
    [addMutation.isPending, addMutation.variables, removeMutation.isPending, removeMutation.variables],
  );

  // Resolves true when the course is in the wishlist afterwards, false when it
  // couldn't be added (non-student account or request failure).
  const addCourse = useCallback(
    async (course, { silent = false } = {}) => {
      if (wishlistIds.has(course.id)) return true;
      if (isGuest) {
        addToGuestWishlist(course);
        if (!silent) toastSuccess("Added to your wishlist.");
        return true;
      }
      if (!isStudent) {
        toastInfo("Only student accounts can add courses to their wishlist.");
        return false;
      }
      try {
        await addMutation.mutateAsync(course.id);
        if (!silent) toastSuccess("Added to your wishlist.");
        return true;
      } catch {
        return false;
      }
    },
    [wishlistIds, isGuest, isStudent, addMutation],
  );

  const removeCourse = useCallback(
    (courseId) => {
      if (isGuest) {
        removeFromGuestWishlist(courseId);
      } else if (isStudent) {
        removeMutation.mutate(courseId);
      }
    },
    [isGuest, isStudent, removeMutation],
  );

  const toggleCourse = useCallback(
    (course) => (wishlistIds.has(course.id) ? removeCourse(course.id) : addCourse(course)),
    [wishlistIds, addCourse, removeCourse],
  );

  return {
    courses,
    count: courses.length,
    isLoading: isServerWishlist && isLoading,
    isGuest,
    isInWishlist,
    isPending,
    addCourse,
    removeCourse,
    toggleCourse,
  };
}
