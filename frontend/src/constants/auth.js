/**
 * Auth / session cookie names.
 * The session cookie is httpOnly and set only from API routes.
 */
export const AUTH_COOKIE = {
  SESSION: "ttl_session",
};

/** Non-sensitive UI preference cookie (readable from the client). */
export const PREFERENCE_COOKIE = {
  THEME: "ttl_theme",
};

export const AUTH_ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  GUEST: "guest",
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
