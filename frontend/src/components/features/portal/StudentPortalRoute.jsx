"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import Loader from "@/components/ui/Loader";
import StudentPortal from "./StudentPortal";
import { DEFAULT_PORTAL_SLUG, isValidPortalSlug } from "./shell/portalNav";

// The client half of the student portal's route: who is allowed in, and
// which screen the URL asked for. The page itself stays a server component
// so it can `await params` the way every other route here does.
export default function StudentPortalRoute({ slug }) {
  const router = useRouter();
  const { isAuthenticated, role, status } = useAuth();

  const isResolving = status === "idle" || status === "loading";
  const isWrongRole = isAuthenticated && role !== AUTH_ROLES.STUDENT;
  const resolvedSlug = slug ?? DEFAULT_PORTAL_SLUG;
  const isUnknownSlug = !isValidPortalSlug(AUTH_ROLES.STUDENT, resolvedSlug);

  useEffect(() => {
    if (isResolving || !isWrongRole) return;
    router.replace(getPortalRouteForRole(role));
  }, [isResolving, isWrongRole, role, router]);

  // A slug nobody serves (a typo, a renamed screen) goes to the portal's
  // front page rather than rendering an empty frame.
  useEffect(() => {
    if (isUnknownSlug) router.replace(ROUTES.STUDENT_PORTAL);
  }, [isUnknownSlug, router]);

  if (isResolving) return <Loader label="Loading Cool Nerdz Portal..." />;
  if (isWrongRole) return <Loader label="Redirecting..." />;

  return <StudentPortal slug={isUnknownSlug ? DEFAULT_PORTAL_SLUG : resolvedSlug} />;
}
