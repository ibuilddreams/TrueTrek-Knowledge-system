import { ROUTES, ROUTE_KEYS } from "./routes";
import { PRIMARY_AUDIENCE_SLUG } from "@/data/audiences";

// No "Home" entry: the design makes the wordmark the way home, so a separate
// link would be a second control for the same destination. The logo in
// `Navbar` carries that job (and its own title/aria label).
export const NAV_LINKS = [
  {
    id: "nav-link-curriculum",
    key: ROUTE_KEYS.CURRICULUM,
    href: ROUTES.CURRICULUM,
    label: "Curriculum",
    mobileLabel: "Curriculum Core",
    title: "Explore the 14-Tier Incubator Life Curriculum",
  },
  {
    id: "nav-link-audiences",
    key: ROUTE_KEYS.AUDIENCES,
    href: `${ROUTES.AUDIENCES}/${PRIMARY_AUDIENCE_SLUG}`,
    label: "Who it's for",
    mobileLabel: "Who It's For",
    title: "See the pathways built for each kind of learner",
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
    id: "nav-link-partnerships",
    key: ROUTE_KEYS.PARTNERSHIPS,
    href: ROUTES.PARTNERSHIPS,
    label: "For schools",
    mobileLabel: "For Schools",
    title: "License the curriculum and portal for your whole school",
  },
  {
    id: "nav-link-faq",
    key: ROUTE_KEYS.FAQ,
    href: ROUTES.FAQ,
    label: "FAQ",
    mobileLabel: "FAQ & Support",
    title: "Review frequently asked questions about Cool Nerdz",
  },
];

export const FOOTER_LINKS = [
  { href: ROUTES.CURRICULUM, label: "The 11 Tiers Portfolio" },
  { href: ROUTES.PARTNERSHIPS, label: "School Licensing cost" },
  { href: ROUTES.STUDENT_PORTAL, label: "Daily Drill Sandbox" },
  { href: ROUTES.STORE, label: "Strategic Merchant Store" },
  { href: ROUTES.FAQ, label: "Frequently Asked Questions" },
];

export const GOVERNANCE_BADGES = [
  "NCAA Bylaws Certified",
  "FERPA & COPPA Secure",
  "IP Trademark Compliant",
];

/** @deprecated Unused leftover from the removed theme toggle. */
export const THEME_STORAGE_KEY = "ttl_theme";
