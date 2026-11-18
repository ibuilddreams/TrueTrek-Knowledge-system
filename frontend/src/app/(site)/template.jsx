import RouteScrollReset from "@/components/layout/RouteScrollReset";

// Next.js mounts a fresh instance of template.jsx (with its children) for
// every navigation within this route group, which is what gives
// RouteScrollReset a `usePathname()` that always arrives in the same mount as
// the new page's children. It stays a server component; the hook lives in the
// client component below it.
export default function SiteTemplate({ children }) {
  return <RouteScrollReset>{children}</RouteScrollReset>;
}
