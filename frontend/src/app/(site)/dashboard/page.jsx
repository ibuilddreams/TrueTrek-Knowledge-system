"use client";

import TeacherPortal from "@/components/features/teachers/TeacherPortal";
import AdminDashboard from "@/components/features/admin/AdminDashboard";
import { usePortalSession } from "@/hooks/usePortalSession";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";

export default function DashboardPage() {
  const { aggregateScore } = usePortalSession();
  const { role } = useAuth();

  if (role === AUTH_ROLES.ADMIN) {
    return <AdminDashboard />;
  }

  return <TeacherPortal aggregateScore={aggregateScore} />;
}
