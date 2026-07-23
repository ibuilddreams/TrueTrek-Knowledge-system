"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { toastError } from "@/lib/toast";

const SUCCESS_DISPLAY_MS = 1000;

export function useLogoutFlow() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stage, setStage] = useState("idle");

  const signOut = useCallback(async () => {
    if (stage !== "idle") return;
    setStage("loading");
    try {
      await logout();
      setStage("success");
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_DISPLAY_MS));
      router.replace(ROUTES.LOGIN);
    } catch (error) {
      setStage("idle");
      toastError(error?.message || "Unable to sign out. Please try again.");
    }
  }, [logout, router, stage]);

  return {
    stage,
    isSigningOut: stage !== "idle",
    signOut,
  };
}
