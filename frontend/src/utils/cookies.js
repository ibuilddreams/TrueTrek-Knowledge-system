/**
 * Client-side cookie helpers for NON-SENSITIVE preferences only.
 * Never store auth tokens or PII here — use httpOnly cookies via the auth API.
 */

export function getClientCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Writes a cookie. `days` of `null` writes a **session cookie** — no Max-Age,
 * so the browser drops it when it closes. That is what backs the sign-in
 * dialog's "Keep me signed in on this device": unticked, the session lasts
 * until the browser is shut rather than the default year.
 */
export function setClientCookie(name, value, days = 365) {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:"
      ? "; Secure"
      : "";
  const lifetime = days === null ? "" : `; Max-Age=${days * 24 * 60 * 60}`;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/${lifetime}; SameSite=Lax${secure}`;
}

export function removeClientCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}
