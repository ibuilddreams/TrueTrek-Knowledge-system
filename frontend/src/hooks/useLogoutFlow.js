"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { toastError } from "@/lib/toast";
import { selectLogoutStage, setLogoutStage } from "@/store/slices/ui/uiSlice";

const SUCCESS_DISPLAY_MS = 1000;

export function useLogoutFlow() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { logout } = useAuth();
  const stage = useSelector(selectLogoutStage);

  const signOut = useCallback(async () => {
    if (stage !== "idle") return;
    dispatch(setLogoutStage("loading"));
    try {
      await logout();
      dispatch(setLogoutStage("success"));
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_DISPLAY_MS));
      router.replace(ROUTES.LOGIN);
    } catch (error) {
      dispatch(setLogoutStage("idle"));
      toastError(error?.message || "Unable to sign out. Please try again.");
    }
  }, [dispatch, logout, router, stage]);

  return {
    stage,
    isSigningOut: stage !== "idle",
    signOut,
  };
}
