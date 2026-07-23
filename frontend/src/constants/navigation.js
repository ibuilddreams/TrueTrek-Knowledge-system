import { ROUTES, ROUTE_KEYS } from "./routes";

export const NAV_LINKS = [
  {
    id: "nav-link-home",
    key: ROUTE_KEYS.HOME,
    href: ROUTES.HOME,
    label: "Home",
    mobileLabel: "Home Orientation",
    title: "View the TrueTrek program orientation and overview",
  },
  {
    id: "nav-link-curriculum",
    key: ROUTE_KEYS.CURRICULUM,
    href: ROUTES.CURRICULUM,
    label: "Curriculum",
    mobileLabel: "Curriculum Core",
    title: "Explore the 14-Tier Incubator Life Curriculum",
  },
  {
    id: "nav-link-partnerships",
    key: ROUTE_KEYS.PARTNERSHIPS,
    href: ROUTES.PARTNERSHIPS,
    label: "For Schools",
    mobileLabel: "For Schools (Licenses)",
    title: "Review academic institutional licenses and partnerships",
  },
  {
    id: "nav-link-store",
    key: ROUTE_KEYS.STORE,
    href: ROUTES.STORE,
    label: "Store",
    mobileLabel: "Strategic Store",
    title: "Purchase strategic merchandise and program materials",
  },
  {
    id: "nav-link-future-clients",
    key: ROUTE_KEYS.FUTURE_CLIENTS,
    href: ROUTES.FUTURE_CLIENTS,
    label: "Future Clients",
    mobileLabel: "Future Clients",
    title: "Calculate program metrics and configure parent/guardian custom plans",
  },
];

export const FOOTER_LINKS = [
  { href: ROUTES.CURRICULUM, label: "The 11 Tiers Portfolio" },
  { href: ROUTES.PARTNERSHIPS, label: "School Licensing cost" },
  { href: ROUTES.PORTAL, label: "Daily Drill Sandbox" },
  { href: ROUTES.STORE, label: "Strategic Merchant Store" },
];

export const GOVERNANCE_BADGES = [
  "NCAA Bylaws Certified",
  "FERPA & COPPA Secure",
  "IP Trademark Compliant",
];

/** @deprecated Prefer PREFERENCE_COOKIE.THEME from constants/auth */
export const THEME_STORAGE_KEY = "ttl_theme";
