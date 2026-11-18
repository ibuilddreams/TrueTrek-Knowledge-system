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
    isAdvisor: Boolean(rawUser.is_advisor),
  };
}

// `remember` is the sign-in dialog's "Keep me signed in on this device".
// Ticked (the default, and what every other entry point passes) the session
// cookies carry the usual year; unticked they become session cookies and the
// browser drops them when it closes.
function persistBackendSession(responseData, { remember = true } = {}) {
  const { access_token, refresh_token, user } = responseData || {};
  const publicUser = toPublicBackendUser(user);
  const days = remember ? 365 : null;

  setClientCookie(AUTH_COOKIE.ACCESS_TOKEN, access_token, days);
  setClientCookie(AUTH_COOKIE.REFRESH_TOKEN, refresh_token, days);
  setClientCookie(AUTH_COOKIE.USER, JSON.stringify(publicUser), days);
  setClientCookie(AUTH_COOKIE.PERSIST, remember ? "1" : "0", days);

  return { user: publicUser };
}

export async function loginWithCredentials({ email, password, remember = true }) {
  const response = await backendClient.post("/auth/login/", {
    email,
    password,
  });
  return persistBackendSession(response?.data, { remember });
}

// `role` is the backend role the visitor picked on the signup form — "STUDENT"
// or "TEACHER" (users.CustomUser.Roles). The endpoint accepts those two only
// and defaults to STUDENT when it is omitted, so it stays optional here.
export async function signup({ username, firstName, lastName, email, password, role }) {
  const response = await backendClient.post("/auth/signup/", {
    username,
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    ...(role ? { role } : {}),
  });
  return persistBackendSession(response?.data);
}

// `credential` is the ID token JWT Google's Identity Services callback hands
// back (see GoogleSignInButton.jsx) — the backend verifies it against
// GOOGLE_CLIENT_ID and either logs in the matching account or creates a new
// STUDENT one.
export async function loginWithGoogle(credential) {
  const response = await backendClient.post("/auth/google/", { credential });
  return persistBackendSession(response?.data);
}

export async function forgotPassword({ email }) {
  const response = await backendClient.post("/auth/forgot-password/", {
    email,
  });
  return response?.message;
}

export async function resetPassword({ uid, token, newPassword, confirmPassword }) {
  const response = await backendClient.post("/auth/reset-password/", {
    uid,
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return response?.message;
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
  // The "keep me signed in" choice belongs to the session that set it, so it
  // goes out with the rest of them rather than being inherited by whoever
  // signs in next on this browser.
  removeClientCookie(AUTH_COOKIE.PERSIST);
}
