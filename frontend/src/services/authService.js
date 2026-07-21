import { apiClient } from "./apiClient";
import { AUTH_ROLES } from "@/constants/auth";

/**
 * Auth service — all session persistence goes through httpOnly cookies
 * via these endpoints. Redux only mirrors public user state.
 */
export async function login({ email, password, role, name }) {
  return apiClient.post("/api/auth/login", {
    email,
    password,
    role: role || AUTH_ROLES.STUDENT,
    name,
  });
}

export async function loginAsStudent({ email, password, name }) {
  return login({
    email,
    password,
    role: AUTH_ROLES.STUDENT,
    name,
  });
}

export async function loginAsFaculty({ email, password, name }) {
  return login({
    email,
    password,
    role: AUTH_ROLES.FACULTY,
    name,
  });
}

export async function logout() {
  return apiClient.post("/api/auth/logout", {});
}

export async function fetchCurrentUser() {
  return apiClient.get("/api/auth/me", { skipAuth: true });
}
