"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";
import Loader from "@/components/ui/Loader";
import { portalHref } from "@/components/features/portal/shell/portalNav";

/**
 * Messages live inside the portal now — one screen per role, under the
 * portal's own sidebar and top bar, exactly as the design has them. This
 * route stays because old links and bookmarks point at it (and because it is
 * where an unauthenticated visitor's `?next=` lands), and forwards to
 * whichever portal the signed-in account belongs to, carrying any
 * `?conversation=` deep link with it.
 */
function MessagesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, role, status } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(buildAuthUrl(ROUTES.LOGIN, ROUTES.MESSAGES));
      return;
    }

    const conversation = searchParams.get("conversation");
    const href = portalHref(role, "messages");
    router.replace(
      conversation ? `${href}?conversation=${encodeURIComponent(conversation)}` : href,
    );
  }, [isResolving, isAuthenticated, role, router, searchParams]);

  return <Loader tone="cobalt" label="Opening your messages..." />;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Loader tone="cobalt" label="Opening your messages..." />}>
      <MessagesRedirect />
    </Suspense>
  );
}
