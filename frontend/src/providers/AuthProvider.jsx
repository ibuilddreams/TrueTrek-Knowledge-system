"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import {
  authCleared,
  authFailed,
  authLoading,
  authSucceeded,
} from "@/store/slices/auth/authSlice";
import {
  clearBackendSession,
  fetchCurrentUser,
  getStoredBackendUser,
} from "@/services/authService";
import { addErrorInterceptor } from "@/services/apiClient";
import { ROUTES } from "@/constants/routes";
import { toastError } from "@/lib/toast";

export default function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const backendUser = getStoredBackendUser();
      if (backendUser) {
        if (!cancelled) dispatch(authSucceeded(backendUser));
        return;
      }

      dispatch(authLoading());

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
      if (error?.code === "SESSION_EXPIRED") {
        clearBackendSession();
        dispatch(authCleared());
        if (pathnameRef.current !== ROUTES.LOGIN) {
          toastError("Session expired. Please log in again.");
          router.replace(ROUTES.LOGIN);
        }
      } else if (error?.status === 401 || error?.code === "UNAUTHORIZED") {
        dispatch(authCleared());
      }
      throw error;
    });

    return () => {
      cancelled = true;
      remove();
    };
  }, [dispatch, router]);

  return children;
}
