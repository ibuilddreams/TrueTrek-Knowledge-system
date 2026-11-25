"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/features/admin/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import Loader from "@/components/ui/Loader";
import {
  DEFAULT_PORTAL_SLUG,
  isValidPortalSlug,
} from "@/components/features/portal/shell/portalNav";

export default function AdminPortalRoute({ slug }) {
  const router = useRouter();
  const { role, status, isAuthenticated } = useAuth();

  const isResolving = status === "idle" || status === "loading";
  const resolvedSlug = slug ?? DEFAULT_PORTAL_SLUG;
  const isUnknownSlug = !isValidPortalSlug(AUTH_ROLES.ADMIN, resolvedSlug);

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (role !== AUTH_ROLES.ADMIN) {
      router.replace(getPortalRouteForRole(role));
    }
  }, [isResolving, isAuthenticated, role, router]);

  // A slug nobody serves goes to the portal's front page rather than
  // rendering an empty frame.
  useEffect(() => {
    if (isUnknownSlug) router.replace(ROUTES.ADMIN_PORTAL);
  }, [isUnknownSlug, router]);

  if (isResolving) {
    return <Loader tone="cobalt" label="Loading admin portal..." />;
  }

  if (!isAuthenticated) {
    return <Loader tone="cobalt" label="Redirecting to sign in..." />;
  }

  if (role !== AUTH_ROLES.ADMIN) {
    return <Loader tone="cobalt" label="Redirecting..." />;
  }

  return <AdminDashboard slug={isUnknownSlug ? DEFAULT_PORTAL_SLUG : resolvedSlug} />;
}
