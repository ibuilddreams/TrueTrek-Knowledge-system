"use client";

import { ExternalLink, FileText, Film } from "lucide-react";
import { QUALIFICATION_OPTIONS } from "@/constants/teacherOnboarding";
import CredentialRow from "./CredentialRow";

function SummaryBlock({ label, children }) {
  return (
    <div className="py-3 border-b border-line last:border-b-0 last:pb-0">
      <p className="text-[10px] font-sans uppercase tracking-widest text-muted font-medium mb-1">
        {label}
      </p>
      <div className="text-sm text-ink font-light leading-relaxed break-words whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function qualificationLabel(value) {
  return QUALIFICATION_OPTIONS.find((option) => option.value === value)?.label || "—";
}

/**
 * Everything an application says, rendered once.
 *
 * Three screens show this: the teacher's review step before they submit, the
 * read-only panel they see while it is with the review team, and the admin's
 * review modal. They are deliberately the same component — a reviewer
 * approving something laid out differently from what the applicant sent is
 * how a detail goes missing.
 *
 * `withDocuments` swaps the plain document list for the full rows with their
 * open links, which is what the reviewer needs and the applicant has already
 * seen on the credentials step.
 */
export default function ApplicationSummary({ application, withDocuments = false }) {
  const videoUrl = application.intro_video_display_url;

  return (
    <div>
      <SummaryBlock label="Headline">{application.headline || "—"}</SummaryBlock>
      <SummaryBlock label="About">{application.bio || "—"}</SummaryBlock>
      <SummaryBlock label="Highest qualification">
        {qualificationLabel(application.highest_qualification)}
      </SummaryBlock>
      <SummaryBlock label="Years of experience">
        {application.years_of_experience ?? "—"}
      </SummaryBlock>
      <SummaryBlock label="Subjects">
        {application.expertise?.length ? (
          <div className="flex flex-wrap gap-2">
            {application.expertise.map((subject) => (
              <span
                key={subject}
                className="inline-flex items-center rounded-full bg-porcelain border border-line px-3 py-1 text-xs font-sans text-ink"
              >
                {subject}
              </span>
            ))}
          </div>
        ) : (
          "—"
        )}
      </SummaryBlock>
      <SummaryBlock label="Teaching approach">
        {application.teaching_statement || "—"}
      </SummaryBlock>

      {(application.linkedin_url || application.portfolio_url) && (
        <SummaryBlock label="Links">
          <div className="flex flex-col gap-1.5">
            {[application.linkedin_url, application.portfolio_url].filter(Boolean).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-pine hover:text-moss transition truncate"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </SummaryBlock>
      )}

      <SummaryBlock label={`Documents (${application.credentials?.length || 0})`}>
        {application.credentials?.length ? (
          withDocuments ? (
            <ul className="space-y-2.5">
              {application.credentials.map((credential) => (
                <CredentialRow key={credential.id} credential={credential} readOnly />
              ))}
            </ul>
          ) : (
            <ul className="space-y-1.5">
              {application.credentials.map((credential) => (
                <li key={credential.id} className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="truncate">
                    {credential.title}
                    <span className="text-muted"> · {credential.credential_type_display}</span>
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : (
          "—"
        )}
      </SummaryBlock>

      <SummaryBlock label="Intro video">
        {videoUrl ? (
          <div className="space-y-2">
            {application.intro_video_file_url && (
              <video
                src={application.intro_video_file_url}
                controls
                preload="metadata"
                className="w-full max-h-64 rounded-xl bg-ink"
              />
            )}
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-pine hover:text-moss transition"
            >
              <Film className="w-3.5 h-3.5" />
              {application.intro_video_name || "Open video"}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          "—"
        )}
      </SummaryBlock>
    </div>
  );
}
