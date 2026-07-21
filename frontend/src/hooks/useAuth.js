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
} from "@/store/slices/auth/authSlice";
import {
  fetchCurrentUser,
  loginAsFaculty,
  loginAsStudent,
  logout as logoutRequest,
} from "@/services/authService";
import { AUTH_ROLES } from "@/constants/auth";

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

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      dispatch(authCleared());
    }
  }, [dispatch]);

  return {
    ...auth,
    user,
    isAuthenticated,
    role,
    isStudent,
    isFaculty,
    isStudentSession:
      isAuthenticated && (role === AUTH_ROLES.STUDENT || !role),
    isFacultySession: isAuthenticated && role === AUTH_ROLES.FACULTY,
    loginStudent,
    loginFaculty,
    logout,
    refreshSession,
  };
}
