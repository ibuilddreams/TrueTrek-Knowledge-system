import SiteShell from "@/components/layout/SiteShell";

// The page-transition wrapper lives in ./template.jsx, not here — see that
// file for why. layout.jsx persists across navigations, so it must not
// own anything keyed by the route.
export default function SiteLayout({ children }) {
  return <SiteShell>{children}</SiteShell>;
}
