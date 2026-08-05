"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  authCleared,
  authFailed,
  authLoading,
  authSucceeded,
  selectAuth,
  selectAuthRole,
  selectAuthUser,
  selectIsAuthenticated,
  selectIsFaculty,
  selectIsStudent,
  setAuthUser,
} from "@/store/slices/auth/authSlice";
import {
  clearBackendSession,
  fetchCurrentUser,
  loginAsFaculty,
  loginAsStudent,
  loginWithCredentials,
  logout as logoutRequest,
} from "@/services/authService";
import { AUTH_ROLES } from "@/constants/auth";
import { getQueryClient } from "@/lib/queryClient";

/**
 * Cookie-backed authentication hook.
 * Tokens never touch Redux or localStorage — only public user fields are mirrored.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);
  const isStudent = useSelector(selectIsStudent);
  const isFaculty = useSelector(selectIsFaculty);

  const refreshSession = useCallback(async () => {
    dispatch(authLoading());
    try {
      const data = await fetchCurrentUser();
      if (data?.authenticated && data.user) {
        dispatch(authSucceeded(data.user));
        return data.user;
      }
      dispatch(authCleared());
      return null;
    } catch (error) {
      dispatch(authFailed(error?.message));
      return null;
    }
  }, [dispatch]);

  const loginStudent = useCallback(
    async ({ email, password, name }) => {
      dispatch(authLoading());
      try {
        const data = await loginAsStudent({ email, password, name });
        if (data?.user) {
          getQueryClient().clear();
          dispatch(authSucceeded(data.user));
        }
        return data;
      } catch (error) {
        dispatch(authFailed(error?.message));
        throw error;
      }
    },
    [dispatch]
  );

  const loginFaculty = useCallback(
    async ({ email, password, name }) => {
      dispatch(authLoading());
      try {
        const data = await loginAsFaculty({ email, password, name });
        if (data?.user) {
          getQueryClient().clear();
          dispatch(authSucceeded(data.user));
        }
        return data;
      } catch (error) {
        dispatch(authFailed(error?.message));
        throw error;
      }
    },
    [dispatch]
  );

  const login = useCallback(
    async ({ email, password }) => {
      dispatch(authLoading());
      try {
        const data = await loginWithCredentials({ email, password });
        getQueryClient().clear();
        dispatch(authSucceeded(data.user));
        return data;
      } catch (error) {
        dispatch(authFailed(error?.message));
        throw error;
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // /api/auth/logout only clears the legacy demo-scaffold session cookie
      // (unused by the real backend-authenticated flow) — never let it block
      // the real cleanup below, which is what actually ends the session.
    } finally {
      clearBackendSession();
      dispatch(authCleared());
      // Every cached query (dashboard, course detail, quizzes, submissions, grades, ...)
      // is keyed on data scope, not on user id, and the QueryClient is a module-level
      // singleton — without this, a different account logging in in the same tab would
      // render this user's cached progress/completion data before the first refetch.
      getQueryClient().clear();
    }
  }, [dispatch]);

  const updateUserName = useCallback(
    (name) => {
      if (!user) return;
      dispatch(setAuthUser({ ...user, name }));
    },
    [dispatch, user]
  );

  return {
    ...auth,
    user,
    isAuthenticated,
    role,
    isStudent,
    isFaculty,
    isAdmin: role === AUTH_ROLES.ADMIN,
    isStudentSession:
      isAuthenticated && (role === AUTH_ROLES.STUDENT || !role),
    isFacultySession: isAuthenticated && role === AUTH_ROLES.FACULTY,
    login,
    loginStudent,
    loginFaculty,
    logout,
    refreshSession,
    updateUserName,
  };
}
