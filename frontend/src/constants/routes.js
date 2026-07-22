/**
 * Central route path constants for App Router navigation.
 */
export const ROUTES = {
  HOME: "/",
  CURRICULUM: "/curriculum",
  PARTNERSHIPS: "/partnerships",
  STORE: "/store",
  FUTURE_CLIENTS: "/future-clients",
  PORTAL: "/portal",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  TEACHERS: "/teachers",
  PROFILE: "/profile",
};

export const ROUTE_KEYS = {
  HOME: "home",
  CURRICULUM: "curriculum",
  PARTNERSHIPS: "partnerships",
  STORE: "store",
  FUTURE_CLIENTS: "future-clients",
  PORTAL: "portal",
  LOGIN: "login",
  DASHBOARD: "dashboard",
  TEACHERS: "teachers",
};

/** Map pathname → logical section key used for active nav styling */
export function getSectionFromPathname(pathname) {
  if (!pathname || pathname === "/") return ROUTE_KEYS.HOME;
  if (pathname.startsWith(ROUTES.CURRICULUM)) return ROUTE_KEYS.CURRICULUM;
  if (pathname.startsWith(ROUTES.PARTNERSHIPS)) return ROUTE_KEYS.PARTNERSHIPS;
  if (pathname.startsWith(ROUTES.STORE)) return ROUTE_KEYS.STORE;
  if (pathname.startsWith(ROUTES.FUTURE_CLIENTS)) return ROUTE_KEYS.FUTURE_CLIENTS;
  if (
    pathname.startsWith(ROUTES.PORTAL) ||
    pathname.startsWith(ROUTES.LOGIN) ||
    pathname.startsWith(ROUTES.FORGOT_PASSWORD) ||
    pathname.startsWith(ROUTES.RESET_PASSWORD)
  ) {
    return ROUTE_KEYS.PORTAL;
  }
  if (
    pathname.startsWith(ROUTES.DASHBOARD) ||
    pathname.startsWith(ROUTES.TEACHERS) ||
    pathname.startsWith(ROUTES.PROFILE)
  ) {
    return ROUTE_KEYS.DASHBOARD;
  }
  return ROUTE_KEYS.HOME;
}
