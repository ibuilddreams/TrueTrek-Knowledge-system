import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";

// Where a visitor should land after signing in or signing up, carried in a
// `?next=` query param. Only same-site paths are ever honored — never an
// arbitrary URL — and a few destinations are excluded:
// - auth screens themselves (would bounce straight back),
// - role portals (the normal role-based redirect already picks the right one),
// - student-only pages for non-student accounts.
const FALLBACK_ORIGIN = "http://internal.invalid";
const MAX_LENGTH = 500;

const EXCLUDED_PREFIXES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.ADMIN_PORTAL,
  ROUTES.TEACHER_PORTAL,
  ROUTES.STUDENT_PORTAL,
  ROUTES.PORTAL,
  ROUTES.DASHBOARD,
  ROUTES.ONBOARDING,
  "/api",
];

const STUDENT_ONLY_PREFIXES = [ROUTES.CART, ROUTES.WISHLIST];

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Returns a safe internal path (with query/hash) or null. */
export function sanitizeNextPath(raw, role) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;

  let url;
  try {
    url = new URL(raw, FALLBACK_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== FALLBACK_ORIGIN) return null;

  const { pathname } = url;
  if (EXCLUDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return null;
  if (
    role !== undefined &&
    role !== AUTH_ROLES.STUDENT &&
    STUDENT_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  ) {
    return null;
  }

  return `${pathname}${url.search}${url.hash}`;
}

/** Reads and validates `?next=` from a query string (e.g. window.location.search). */
export function getNextPathFromSearch(search, role) {
  return sanitizeNextPath(new URLSearchParams(search).get("next"), role);
}

/** Builds `/login?next=...` or `/signup?next=...` for the given destination. */
export function buildAuthUrl(authRoute, nextPath) {
  const safe = sanitizeNextPath(nextPath);
  return safe ? `${authRoute}?next=${encodeURIComponent(safe)}` : authRoute;
}
