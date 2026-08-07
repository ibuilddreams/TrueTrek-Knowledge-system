"use client";

import ViewTransition from "@/components/ui/ViewTransition";

export default function TabTransition({ activeKey, children }) {
  return <ViewTransition viewKey={activeKey}>{children}</ViewTransition>;
}
