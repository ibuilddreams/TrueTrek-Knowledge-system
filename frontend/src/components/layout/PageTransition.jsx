"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ViewTransition from "@/components/ui/ViewTransition";

export default function PageTransition({ children }) {
  const pathname = usePathname();

  // The exit animation keeps the previous page mounted while Next.js performs
  // its own scroll reset, so the new page can inherit the old scroll offset.
  // Reset explicitly whenever the pathname changes (query-only changes such as
  // portal tabs are handled by their own setActiveTab).
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return <ViewTransition viewKey={pathname}>{children}</ViewTransition>;
}
