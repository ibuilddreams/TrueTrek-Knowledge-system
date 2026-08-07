"use client";

import { usePathname } from "next/navigation";
import ViewTransition from "@/components/ui/ViewTransition";

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return <ViewTransition viewKey={pathname}>{children}</ViewTransition>;
}
