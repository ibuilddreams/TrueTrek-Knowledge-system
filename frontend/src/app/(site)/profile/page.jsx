"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";
import Loader from "@/components/ui/Loader";
import { portalHref } from "@/components/features/portal/shell/portalNav";

/**
 * Profile & settings is a portal screen now — one page per role under the
 * portal's own sidebar and top bar, exactly as the design has it. This route
 * stays for old links and bookmarks (and for an unauthenticated visitor's
 * `?next=`) and forwards to whichever portal the account belongs to.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, role, status } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(buildAuthUrl(ROUTES.LOGIN, ROUTES.PROFILE));
      return;
    }

    router.replace(portalHref(role, "profile"));
  }, [isResolving, isAuthenticated, role, router]);

  return <Loader tone="cobalt" label="Opening your profile..." />;
}
