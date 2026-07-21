import { apiClient, backendClient } from "./apiClient";
import { AUTH_COOKIE, AUTH_ROLES, BACKEND_ROLE_MAP } from "@/constants/auth";
import {
  getClientCookie,
  removeClientCookie,
  setClientCookie,
} from "@/utils/cookies";

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

function toPublicBackendUser(rawUser) {
  return {
    id: rawUser.id,
    email: rawUser.email,
    name: rawUser.full_name || `${rawUser.first_name} ${rawUser.last_name}`.trim(),
    role: BACKEND_ROLE_MAP[rawUser.role] || AUTH_ROLES.GUEST,
  };
}

export async function loginWithCredentials({ email, password }) {
  const response = await backendClient.post("/auth/login/", {
    email,
    password,
  });
  const { access_token, refresh_token, user } = response?.data || {};
  const publicUser = toPublicBackendUser(user);

  setClientCookie(AUTH_COOKIE.ACCESS_TOKEN, access_token);
  setClientCookie(AUTH_COOKIE.REFRESH_TOKEN, refresh_token);
  setClientCookie(AUTH_COOKIE.USER, JSON.stringify(publicUser));

  return { user: publicUser };
}

export function getStoredBackendUser() {
  const accessToken = getClientCookie(AUTH_COOKIE.ACCESS_TOKEN);
  const rawUser = getClientCookie(AUTH_COOKIE.USER);
  if (!accessToken || !rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function clearBackendSession() {
  removeClientCookie(AUTH_COOKIE.ACCESS_TOKEN);
  removeClientCookie(AUTH_COOKIE.REFRESH_TOKEN);
  removeClientCookie(AUTH_COOKIE.USER);
}
