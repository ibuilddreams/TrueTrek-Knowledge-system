"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  authCleared,
  authFailed,
  authLoading,
  authSucceeded,
} from "@/store/slices/auth/authSlice";
import { fetchCurrentUser, getStoredBackendUser } from "@/services/authService";
import { addErrorInterceptor } from "@/services/apiClient";

/**
 * Hydrates Redux auth from the httpOnly session cookie via /api/auth/me.
 * Also wires a global 401 interceptor for future protected APIs.
 */
export default function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      dispatch(authLoading());

      const backendUser = getStoredBackendUser();
      if (backendUser) {
        if (!cancelled) dispatch(authSucceeded(backendUser));
        return;
      }

      try {
        const data = await fetchCurrentUser();
        if (cancelled) return;
        if (data?.authenticated && data.user) {
          dispatch(authSucceeded(data.user));
        } else {
          dispatch(authCleared());
        }
      } catch (error) {
        if (!cancelled) {
          dispatch(authFailed(error?.message || "Session check failed"));
        }
      }
    }

    hydrate();

    const remove = addErrorInterceptor(async (error) => {
      if (error?.status === 401 || error?.code === "UNAUTHORIZED") {
        dispatch(authCleared());
      }
      throw error;
    });

    return () => {
      cancelled = true;
      remove();
    };
  }, [dispatch]);

  return children;
}
