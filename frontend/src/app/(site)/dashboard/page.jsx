"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TeacherPortal from "@/components/features/teachers/TeacherPortal";
import AdminDashboard from "@/components/features/admin/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import Loader from "@/components/ui/Loader";

export default function DashboardPage() {
  const router = useRouter();
  const { role, status, isAuthenticated } = useAuth();

  const isResolving = status === "idle" || status === "loading";

  useEffect(() => {
    if (isResolving) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (role === AUTH_ROLES.STUDENT) {
      router.replace(ROUTES.PORTAL);
    }
  }, [isResolving, isAuthenticated, role, router]);

  if (isResolving) {
    return <Loader label="Loading Dashboard..." />;
  }

  if (!isAuthenticated) {
    return <Loader label="Redirecting to Sign In..." />;
  }

  if (role === AUTH_ROLES.STUDENT) {
    return <Loader label="Redirecting to Student Portal..." />;
  }

  if (role === AUTH_ROLES.ADMIN) {
    return <AdminDashboard />;
  }

  if (role === AUTH_ROLES.FACULTY) {
    return <TeacherPortal />;
  }

  return <Loader label="Checking Access..." />;
}
