"use client";

import { useEffect, useState } from "react";
import { getNextPathFromSearch } from "@/lib/authRedirect";

// The validated `?next=` destination of the current page, or null. Read after
// mount (not via useSearchParams) so statically rendered auth pages don't
// need a Suspense boundary and server/client markup stay identical.
export function useNextPath() {
  const [nextPath, setNextPath] = useState(null);

  useEffect(() => {
    setNextPath(getNextPathFromSearch(window.location.search));
  }, []);

  return nextPath;
}
