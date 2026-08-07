import PageTransition from "@/components/layout/PageTransition";

// Next.js mounts a fresh instance of template.jsx (with its children) for
// every navigation within this route group. That's the point: it guarantees
// PageTransition's usePathname() and the new page's children always arrive
// together in the same mount, so the transition can never start against
// stale content. Wrapping in layout.jsx instead let usePathname() lag a
// render behind the actual children swap, causing the new page to flash in
// at full opacity before a transition animation misfired on it.
export default function SiteTemplate({ children }) {
  return <PageTransition>{children}</PageTransition>;
}
