"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Clock3, Eye, Loader2, ShieldX } from "lucide-react";
import {
  getMyTeacherApplication,
  getTeacherOnboardingStatus,
} from "@/services/teacherOnboardingService";
import { formatDateTime } from "@/lib/adminFormatters";
import { APPLICATION_STATUS } from "@/constants/teacherOnboarding";
import StatusBadge from "@/components/ui/StatusBadge";
import ApplicationSummary from "./ApplicationSummary";
import {
  TEACHER_APPLICATION_QUERY_KEY,
  TEACHER_ONBOARDING_STATUS_QUERY_KEY,
} from "./queryKeys";

// Only the statuses that can actually reach the portal appear here: a teacher
// whose application is still waiting on them never gets this far, because the
// gate hands them the wizard instead.
const BANNERS = {
  [APPLICATION_STATUS.SUBMITTED]: {
    icon: Clock3,
    accent: "bg-gold/10 border-gold/25",
    iconAccent: "bg-paper border-gold/25 text-gold",
    title: "Your application is with the review team",
    body: "Have a look around while you wait. Creating and managing courses opens as soon as an admin approves you, and we'll email you the decision.",
  },
  [APPLICATION_STATUS.UNDER_REVIEW]: {
    icon: Eye,
    accent: "bg-sky/40 border-blue/20",
    iconAccent: "bg-paper border-blue/20 text-blue",
    title: "A reviewer is reading your application",
    body: "Nothing more is needed from you. Creating and managing courses opens as soon as they approve you.",
  },
  [APPLICATION_STATUS.REJECTED]: {
    icon: ShieldX,
    accent: "bg-rose/30 border-clay/25",
    iconAccent: "bg-paper border-clay/25 text-clay",
    title: "Your application wasn't approved",
    body: "The reviewer's notes are below. If you think something was missed, reply to the decision email and the team can reopen your application.",
  },
};

/**
 * The strip across the top of the Faculty Portal for a teacher whose
 * application has been submitted but not yet approved.
 *
 * This exists because submitting now opens the portal rather than parking the
 * teacher on a read-only page — so the portal itself has to say where the
 * review has got to, and why half of it isn't available yet. It renders
 * nothing at all for an approved teacher, or for one who never had an
 * application (every teacher an admin created).
 *
 * It reads the gate's own status query rather than taking a prop, so the two
 * can never disagree about the state, and only fetches the full application
 * when somebody opens it.
 */
export default function TeacherApplicationBanner() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: state } = useQuery({
    queryKey: TEACHER_ONBOARDING_STATUS_QUERY_KEY,
    queryFn: async () => (await getTeacherOnboardingStatus())?.data,
  });

  const applicationQuery = useQuery({
    queryKey: TEACHER_APPLICATION_QUERY_KEY,
    queryFn: async () => (await getMyTeacherApplication())?.data,
    enabled: isExpanded,
  });

  if (!state?.requires_onboarding || state.is_approved) return null;

  const banner = BANNERS[state.status];
  if (!banner) return null;

  const Icon = banner.icon;
  const application = applicationQuery.data;

  return (
    <div className={`rounded-card border p-5 sm:p-6 mb-8 ${banner.accent}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <span
          className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${banner.iconAccent}`}
        >
          <Icon className="w-5 h-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base sm:text-lg font-serif font-light text-ink">{banner.title}</h2>
            <StatusBadge size="lg" status={state.status} />
          </div>
          <p className="text-sm text-muted font-light leading-relaxed mt-1.5 max-w-3xl">
            {banner.body}
          </p>

          <button
            type="button"
            onClick={() => setIsExpanded((previous) => !previous)}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-sans font-medium uppercase tracking-widest text-pine hover:text-moss transition"
          >
            {isExpanded ? "Hide my application" : "View my application"}
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-line">
          {applicationQuery.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted font-light">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your application...
            </p>
          )}

          {application && (
            <div className="space-y-4">
              {application.review_notes && (
                <div className="p-4 rounded-xl bg-paper border border-line">
                  <p className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium mb-1.5">
                    Notes from the review team
                    {application.reviewed_at ? ` · ${formatDateTime(application.reviewed_at)}` : ""}
                  </p>
                  <p className="text-sm text-ink font-light leading-relaxed whitespace-pre-wrap">
                    {application.review_notes}
                  </p>
                </div>
              )}
              <div className="p-5 rounded-xl bg-paper border border-line">
                <ApplicationSummary application={application} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
