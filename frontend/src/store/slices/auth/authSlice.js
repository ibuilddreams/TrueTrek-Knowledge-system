import { createSlice } from "@reduxjs/toolkit";
import { AUTH_ROLES } from "@/constants/auth";

const initialState = {
  status: "idle", // idle | loading | authenticated | anonymous
  isAuthenticated: false,
  user: null, // { id, email, name, role } — public only, never tokens
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    authSucceeded(state, action) {
      state.status = "authenticated";
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    authCleared(state) {
      state.status = "anonymous";
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    authFailed(state, action) {
      state.status = "anonymous";
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload || "Authentication failed";
    },
    setAuthUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.status = action.payload ? "authenticated" : "anonymous";
    },
  },
});

export const {
  authLoading,
  authSucceeded,
  authCleared,
  authFailed,
  setAuthUser,
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthRole = (state) =>
  state.auth.user?.role || AUTH_ROLES.GUEST;
export const selectIsStudent = (state) =>
  state.auth.user?.role === AUTH_ROLES.STUDENT;
export const selectIsFaculty = (state) =>
  state.auth.user?.role === AUTH_ROLES.FACULTY;

export default authSlice.reducer;
