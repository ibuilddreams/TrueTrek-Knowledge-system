"use client";

import TeacherPortal from "@/components/features/teachers/TeacherPortal";
import { usePortalSession } from "@/hooks/usePortalSession";

export default function DashboardPage() {
  const { aggregateScore } = usePortalSession();
  return <TeacherPortal aggregateScore={aggregateScore} />;
}
