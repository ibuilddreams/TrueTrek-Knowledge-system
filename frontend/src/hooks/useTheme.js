"use client";

import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectTheme, setTheme } from "@/store/slices/ui/uiSlice";
import { getClientCookie, setClientCookie } from "@/utils/cookies";
import { PREFERENCE_COOKIE } from "@/constants/auth";

/**
 * Theme preference — non-sensitive UI state.
 * Persisted in a readable preference cookie (not localStorage, not httpOnly auth).
 */
export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);

  useEffect(() => {
    const saved = getClientCookie(PREFERENCE_COOKIE.THEME);
    if (saved === "light" || saved === "vault") {
      dispatch(setTheme(saved));
    }
  }, [dispatch]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "light" ? "vault" : "light";
    dispatch(setTheme(nextTheme));
    setClientCookie(PREFERENCE_COOKIE.THEME, nextTheme);
  }, [dispatch, theme]);

  return { theme, toggleTheme, isVault: theme === "vault" };
}
