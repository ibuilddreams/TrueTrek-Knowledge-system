/**
 * Auth / session cookie names.
 * The session cookie is httpOnly and set only from API routes.
 */
export const AUTH_COOKIE = {
  SESSION: "ttl_session",
  ACCESS_TOKEN: "ttl_access_token",
  REFRESH_TOKEN: "ttl_refresh_token",
  USER: "ttl_auth_user",
};

/** Non-sensitive UI preference cookie (readable from the client). */
export const PREFERENCE_COOKIE = {
  THEME: "ttl_theme",
};

export const AUTH_ROLES = {
  ADMIN: "admin",
  STUDENT: "student",
  FACULTY: "faculty",
  GUEST: "guest",
};

/** Maps backend role values (users.CustomUser.Roles) to AUTH_ROLES. */
export const BACKEND_ROLE_MAP = {
  ADMIN: AUTH_ROLES.ADMIN,
  TEACHER: AUTH_ROLES.FACULTY,
  STUDENT: AUTH_ROLES.STUDENT,
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
