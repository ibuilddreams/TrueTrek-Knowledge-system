"use client";

import { Clock3, Mail, ShieldX } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";
import { APPLICATION_STATUS } from "@/constants/teacherOnboarding";
import StatusBadge from "@/components/ui/StatusBadge";
import ApplicationSummary from "./ApplicationSummary";

const PANELS = {
  WAITING: {
    icon: Clock3,
    accent: "bg-gold/12 border-gold/25 text-gold",
    title: "Your application is with the review team",
    body: "Someone will read it and come back to you. We'll email you as soon as there's a decision, and you'll find it here too. You can't edit the application while it's being reviewed.",
  },
  REJECTED: {
    icon: ShieldX,
    accent: "bg-rose/35 border-clay/25 text-clay",
    title: "Your application wasn't approved",
    body: "The reviewer's notes are below. If you think something was missed, reply to the decision email and the team can reopen your application.",
  },
};

/**
 * The read-only face of an application that is no longer the teacher's to edit.
 *
 * Submitting now opens the Faculty Portal, so in the steady state a teacher
 * sees `TeacherApplicationBanner` inside the portal rather than this. This is
 * the handover: between the submit landing and the gate's status query
 * catching up, the screen is still mounted holding an application it may no
 * longer edit, and this is what it renders in that window. It is also the
 * correct fallback for any other way that pair can disagree — never a
 * half-rendered wizard over a submitted application.
 */
export default function ApplicationStatusPanel({ application }) {
  const isRejected = application.status === APPLICATION_STATUS.REJECTED;
  const panel = isRejected ? PANELS.REJECTED : PANELS.WAITING;
  const Icon = panel.icon;

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-7 bg-paper border border-line rounded-card shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <span
            className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center ${panel.accent}`}
          >
            <Icon className="w-6 h-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1.5">
              <h2 className="text-xl sm:text-2xl font-serif font-light text-ink">{panel.title}</h2>
              <StatusBadge size="lg" status={application.status} />
            </div>
            <p className="text-sm text-muted font-light leading-relaxed max-w-2xl">{panel.body}</p>

            <dl className="flex flex-wrap gap-x-8 gap-y-2 mt-5 pt-5 border-t border-line">
              {application.submitted_at && (
                <div>
                  <dt className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium">
                    Submitted
                  </dt>
                  <dd className="text-sm text-ink font-light mt-0.5">
                    {formatDateTime(application.submitted_at)}
                  </dd>
                </div>
              )}
              {application.reviewed_at && (
                <div>
                  <dt className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium">
                    Reviewed
                  </dt>
                  <dd className="text-sm text-ink font-light mt-0.5">
                    {formatDateTime(application.reviewed_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {application.review_notes && (
          <div className="mt-6 p-4 rounded-xl bg-porcelain border border-line">
            <p className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium mb-1.5">
              Notes from the review team
            </p>
            <p className="text-sm text-ink font-light leading-relaxed whitespace-pre-wrap">
              {application.review_notes}
            </p>
          </div>
        )}

        {!isRejected && (
          <p className="flex items-center gap-2 text-[11px] font-mono text-muted mt-6">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            The decision goes to {application.teacher?.email || "your email address"}.
          </p>
        )}
      </div>

      <div className="p-5 sm:p-6 bg-paper border border-line rounded-card shadow-soft">
        <h3 className="text-sm font-semibold font-sans text-ink mb-1">What you submitted</h3>
        <ApplicationSummary application={application} />
      </div>
    </div>
  );
}
