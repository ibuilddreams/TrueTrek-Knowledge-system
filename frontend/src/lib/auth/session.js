import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  AUTH_ROLES,
  SESSION_MAX_AGE_SECONDS,
} from "@/constants/auth";

/**
 * Server-only session helpers using httpOnly cookies.
 * Future production APIs should replace the payload with a signed JWT / opaque token.
 */

export function buildSessionPayload({
  role = AUTH_ROLES.STUDENT,
  email = "",
  name = "",
  userId = "",
}) {
  return {
    role,
    email,
    name,
    userId: userId || `sim-${role}-${Date.now()}`,
    issuedAt: Date.now(),
  };
}

export async function getSessionCookieValue() {
  const store = await cookies();
  return store.get(AUTH_COOKIE.SESSION)?.value || null;
}

export async function readSession() {
  const raw = await getSessionCookieValue();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.role || !parsed?.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeSession(session) {
  const store = await cookies();
  store.set(AUTH_COOKIE.SESSION, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(AUTH_COOKIE.SESSION, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function toPublicUser(session) {
  if (!session) return null;
  return {
    id: session.userId,
    email: session.email || "",
    name: session.name || "",
    role: session.role || AUTH_ROLES.GUEST,
  };
}
