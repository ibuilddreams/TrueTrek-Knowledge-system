"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getFeedbackStatus } from "@/services/invitationsService";

export default function FeedbackBanner() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const query = useQuery({ queryKey: ["feedbackStatus", user?.id], queryFn: getFeedbackStatus,
    enabled: isAuthenticated && !isAdmin, staleTime: 30000, refetchInterval: 60000, retry: false });
  if (!isAuthenticated || isAdmin || pathname === "/feedback" || !query.data?.data?.eligible || query.data.data.submitted) return null;
  return <aside className="mx-auto max-w-7xl px-5 pt-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pine/20 bg-pine/5 px-5 py-4"><p className="text-sm text-pine">Your feedback form is ready. We&apos;d like to hear about your experience.</p><Link className="rounded-xl bg-pine px-4 py-2 text-sm text-white" href="/feedback">Share feedback</Link></div></aside>;
}
