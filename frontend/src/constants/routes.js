import { AUTH_ROLES } from "./auth";

/**
 * Central route path constants for App Router navigation.
 */
export const ROUTES = {
  HOME: "/",
  CURRICULUM: "/curriculum",
  PARTNERSHIPS: "/partnerships",
  STORE: "/store",
  ONBOARDING: "/onboarding",
  PATHWAYS: "/pathways",
  FUTURE_CLIENTS: "/future-clients",
  ADMIN_PORTAL: "/adminportal",
  TEACHER_PORTAL: "/teacherportal",
  STUDENT_PORTAL: "/studentportal",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  PROFILE: "/profile",
  DASHBOARD: "/dashboard",
  PORTAL: "/portal",
  TEACHERS: "/teachers",
};

export const ROUTE_KEYS = {
  HOME: "home",
  CURRICULUM: "curriculum",
  PARTNERSHIPS: "partnerships",
  STORE: "store",
  ONBOARDING: "onboarding",
  PATHWAYS: "pathways",
  FUTURE_CLIENTS: "future-clients",
  STUDENT_PORTAL: "studentportal",
  ADMIN_PORTAL: "adminportal",
  TEACHER_PORTAL: "teacherportal",
  LOGIN: "login",
  SIGNUP: "signup",
  PORTAL: "portal",
  DASHBOARD: "dashboard",
  TEACHERS: "teachers",
};

export function getPortalRouteForRole(role) {
  if (role === AUTH_ROLES.ADMIN) return ROUTES.ADMIN_PORTAL;
  if (role === AUTH_ROLES.FACULTY) return ROUTES.TEACHER_PORTAL;
  if (role === AUTH_ROLES.STUDENT) return ROUTES.STUDENT_PORTAL;
  return ROUTES.HOME;
}

/** Map pathname → logical section key used for active nav styling */
export function getSectionFromPathname(pathname) {
  if (!pathname || pathname === "/") return ROUTE_KEYS.HOME;
  if (pathname.startsWith(ROUTES.CURRICULUM)) return ROUTE_KEYS.CURRICULUM;
  if (pathname.startsWith(ROUTES.PARTNERSHIPS)) return ROUTE_KEYS.PARTNERSHIPS;
  if (pathname.startsWith(ROUTES.STORE)) return ROUTE_KEYS.STORE;
  if (pathname.startsWith(ROUTES.ONBOARDING)) return ROUTE_KEYS.ONBOARDING;
  if (pathname.startsWith(ROUTES.PATHWAYS)) return ROUTE_KEYS.PATHWAYS;
  if (pathname.startsWith(ROUTES.FUTURE_CLIENTS)) return ROUTE_KEYS.FUTURE_CLIENTS;
  if (
    pathname.startsWith(ROUTES.STUDENT_PORTAL) ||
    pathname.startsWith(ROUTES.PORTAL) ||
    pathname.startsWith(ROUTES.LOGIN) ||
    pathname.startsWith(ROUTES.SIGNUP) ||
    pathname.startsWith(ROUTES.FORGOT_PASSWORD) ||
    pathname.startsWith(ROUTES.RESET_PASSWORD)
  ) {
    return ROUTE_KEYS.STUDENT_PORTAL;
  }
  if (
    pathname.startsWith(ROUTES.ADMIN_PORTAL) ||
    pathname.startsWith(ROUTES.TEACHER_PORTAL) ||
    pathname.startsWith(ROUTES.DASHBOARD) ||
    pathname.startsWith(ROUTES.TEACHERS) ||
    pathname.startsWith(ROUTES.PROFILE)
  ) {
    return ROUTE_KEYS.DASHBOARD;
  }
  return ROUTE_KEYS.HOME;
}
